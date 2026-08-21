import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { RecipeService } from './recipe.service';
import { OfflineQueueService } from './offline-queue.service';
import { Order, OrderItem, PaymentMethod, PaymentSplit } from '../models/order.model';
import { convertUnit } from '../utils/unit-conversion';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(
    private supabase: SupabaseService,
    private recipeService: RecipeService,
    private offlineQueue: OfflineQueueService
  ) {
    window.addEventListener('online', () => this.syncPendingOrders());
  }

  /** Crea la orden. Si no hay conexión, la guarda localmente y la sincroniza después. */
  async createOrder(order: Order): Promise<Order> {
    if (!navigator.onLine) {
      this.offlineQueue.enqueue(order);
      return order;
    }
    try {
      return await this.insertOrder(order);
    } catch (err) {
      console.warn('No se pudo guardar la orden en línea, se encola para sincronizar:', err);
      this.offlineQueue.enqueue(order);
      return order;
    }
  }

  private async insertOrder(order: Order): Promise<Order> {
    const { items, ...header } = order;

    const paymentMethodSummary = header.payments && header.payments.length > 1
      ? 'mixed'
      : header.payments?.[0]?.method ?? header.payment_method ?? null;

    const { data: orderRow, error: orderError } = await this.supabase.client
      .from('orders')
      .insert({
        status: header.status,
        payment_method: paymentMethodSummary,
        payments: header.payments ?? null,
        total: header.total,
        customer_name: header.customer_name ?? null,
        customer_phone: header.customer_phone ?? null,
        table_number: header.table_number ?? null,
        closed_at: header.status === 'paid' ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (orderError) throw orderError;

    const itemsPayload = items.map((it) => ({
      order_id: orderRow.id,
      product_id: it.product_id,
      product_name: it.product_name,
      unit_price: it.unit_price,
      quantity: it.quantity,
      subtotal: it.subtotal,
    }));

    const { error: itemsError } = await this.supabase.client.from('order_items').insert(itemsPayload);
    if (itemsError) throw itemsError;

    if (header.status === 'paid') {
      await this.deductInventoryForItems(items);
    }

    return { ...orderRow, items } as Order;
  }

  /** Reintenta guardar en Supabase las órdenes que quedaron pendientes sin conexión */
  async syncPendingOrders() {
    const pending = this.offlineQueue.getAll();
    for (let i = 0; i < pending.length; i++) {
      try {
        await this.insertOrder(pending[i]);
        this.offlineQueue.removeFirst();
      } catch (err) {
        console.warn('Aún no se pudo sincronizar una orden pendiente:', err);
        break;
      }
    }
  }

  async markOrderPaid(order: Order, payments: PaymentSplit[], customerPhone?: string) {
    const paymentMethodSummary = payments.length > 1 ? 'mixed' : payments[0]?.method ?? 'cash';

    const { error } = await this.supabase.client
      .from('orders')
      .update({
        status: 'paid',
        payment_method: paymentMethodSummary,
        payments,
        customer_phone: customerPhone ?? order.customer_phone ?? null,
        closed_at: new Date().toISOString(),
      })
      .eq('id', order.id);
    if (error) throw error;

    await this.deductInventoryForItems(order.items);
  }

  async getOpenOrders(): Promise<Order[]> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*, order_items(*)')
      .eq('status', 'open')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data as any[]).map((o) => ({ ...o, items: o.order_items })) as Order[];
  }

  async getOrdersBetween(startISO: string, endISO: string): Promise<Order[]> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*, order_items(*)')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as any[]).map((o) => ({ ...o, items: o.order_items })) as Order[];
  }

  async getRecentOrders(limit = 20): Promise<Order[]> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as any[]).map((o) => ({ ...o, items: o.order_items })) as Order[];
  }

  async cancelOrder(id: string) {
    const { error } = await this.supabase.client.from('orders').update({ status: 'cancelled' }).eq('id', id);
    if (error) throw error;
  }

  private async deductInventoryForItems(items: OrderItem[]) {
    const productIds = items.map((i) => i.product_id);
    const entries = await this.recipeService.getRecipeEntriesForProducts(productIds);
    if (!entries.length) return;

    const inventoryIds = [...new Set(entries.map((e) => e.inventory_item_id))];
    const { data: invRows } = await this.supabase.client
      .from('inventory_items')
      .select('id, unit')
      .in('id', inventoryIds);
    const storageUnitMap = new Map((invRows ?? []).map((r: any) => [r.id, r.unit]));

    const deltas = new Map<string, number>();
    entries.forEach((entry) => {
      const orderItem = items.find((i) => i.product_id === entry.product_id);
      if (!orderItem) return;
      const storageUnit = storageUnitMap.get(entry.inventory_item_id) ?? entry.unit;
      const amountInRecipeUnit = entry.quantity_used * orderItem.quantity;
      try {
        const amountConverted = convertUnit(amountInRecipeUnit, entry.unit, storageUnit);
        deltas.set(entry.inventory_item_id, (deltas.get(entry.inventory_item_id) ?? 0) + amountConverted);
      } catch (err) {
        console.warn('Conversión de unidad no válida en receta, se omite el descuento:', err);
      }
    });

    for (const [inventoryItemId, amount] of deltas.entries()) {
      const { data: current, error } = await this.supabase.client
        .from('inventory_items')
        .select('quantity')
        .eq('id', inventoryItemId)
        .single();
      if (error || !current) continue;

      const newQuantity = Math.max(0, current.quantity - amount);
      await this.supabase.client
        .from('inventory_items')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', inventoryItemId);

      await this.supabase.client.from('inventory_movements').insert({
        inventory_item_id: inventoryItemId,
        type: 'out',
        quantity: amount,
        reason: 'Venta automática',
      });
    }
  }
}
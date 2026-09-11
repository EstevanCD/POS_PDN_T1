import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { RecipeService } from './recipe.service';
import { OfflineQueueService } from './offline-queue.service';
import { Order, OrderItem, PaymentSplit } from '../models/order.model';
import { Discount, calculateDiscountAmount } from '../utils/discount.util';
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

    const subtotal = header.subtotal ?? items.reduce((acc, i) => acc + i.subtotal, 0);

    const { data: orderRow, error: orderError } = await this.supabase.client
      .from('orders')
      .insert({
        status: header.status,
        payment_method: paymentMethodSummary,
        payments: header.payments ?? null,
        subtotal,
        discount_type: header.discount_type ?? null,
        discount_value: header.discount_value ?? 0,
        discount_reason: header.discount_reason ?? null,
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
      notes: it.notes ?? null,
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

  /**
   * Agrega productos a una orden abierta que ya existía (ej. la mesa pide algo más).
   * Si la orden ya tenía un descuento, se recalcula sobre el nuevo subtotal.
   */
  async addItemsToOrder(order: Order, newItems: OrderItem[]) {
    if (!order.id || !newItems.length) return;

    const itemsPayload = newItems.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      product_name: it.product_name,
      unit_price: it.unit_price,
      quantity: it.quantity,
      subtotal: it.subtotal,
      notes: it.notes ?? null,
    }));

    const { error: itemsError } = await this.supabase.client.from('order_items').insert(itemsPayload);
    if (itemsError) throw itemsError;

    const addedTotal = newItems.reduce((acc, i) => acc + i.subtotal, 0);
    const currentSubtotal = order.subtotal ?? order.total;
    const newSubtotal = currentSubtotal + addedTotal;

    const discount: Discount | null = order.discount_type
      ? { type: order.discount_type, value: order.discount_value ?? 0, reason: order.discount_reason ?? '' }
      : null;
    const discountAmount = calculateDiscountAmount(newSubtotal, discount);
    const newTotal = Math.max(0, newSubtotal - discountAmount);

    const { error: updateError } = await this.supabase.client
      .from('orders')
      .update({ subtotal: newSubtotal, total: newTotal })
      .eq('id', order.id);
    if (updateError) throw updateError;
  }

  /**
   * Quita un solo producto de una orden abierta (ej. el cliente ya no lo quiere).
   * Recalcula subtotal y total (respetando el descuento vigente, si lo hay).
   * No permite dejar la orden sin ningún producto — para eso se cancela la orden completa.
   */
  async removeItemFromOrder(order: Order, item: OrderItem) {
    if (!item.id) return;
    if (order.items.length <= 1) {
      throw new Error('No puedes quitar el último producto. Cancela la orden completa en su lugar.');
    }

    const { error: delError } = await this.supabase.client.from('order_items').delete().eq('id', item.id);
    if (delError) throw delError;

    const currentSubtotal = order.subtotal ?? order.total;
    const newSubtotal = Math.max(0, currentSubtotal - item.subtotal);

    const discount: Discount | null = order.discount_type
      ? { type: order.discount_type, value: order.discount_value ?? 0, reason: order.discount_reason ?? '' }
      : null;
    const discountAmount = calculateDiscountAmount(newSubtotal, discount);
    const newTotal = Math.max(0, newSubtotal - discountAmount);

    const { error: updateError } = await this.supabase.client
      .from('orders')
      .update({ subtotal: newSubtotal, total: newTotal })
      .eq('id', order.id);
    if (updateError) throw updateError;
  }

  async markOrderPaid(order: Order, payments: PaymentSplit[], customerPhone?: string) {
    const paymentMethodSummary = payments.length > 1 ? 'mixed' : payments[0]?.method ?? 'cash';

    const { error } = await this.supabase.client
      .from('orders')
      .update({
        status: 'paid',
        payment_method: paymentMethodSummary,
        payments,
        discount_type: order.discount_type ?? null,
        discount_value: order.discount_value ?? 0,
        discount_reason: order.discount_reason ?? null,
        total: order.total,
        customer_phone: customerPhone ?? order.customer_phone ?? null,
        closed_at: new Date().toISOString(),
      })
      .eq('id', order.id);
    if (error) throw error;

    await this.deductInventoryForItems(order.items);
  }

  /** Aplica (o quita) un descuento a una orden abierta, antes de cobrarla */
  async applyDiscountToOrder(order: Order, discount: Discount | null) {
    if (!order.id) return;
    const subtotal = order.subtotal ?? order.total;
    const discountAmount = calculateDiscountAmount(subtotal, discount);
    const newTotal = Math.max(0, subtotal - discountAmount);

    const { error } = await this.supabase.client
      .from('orders')
      .update({
        discount_type: discount?.type ?? null,
        discount_value: discount?.value ?? 0,
        discount_reason: discount?.reason ?? null,
        total: newTotal,
      })
      .eq('id', order.id);
    if (error) throw error;
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

  subscribeToOrderChanges(callback: () => void): () => void {
    const channel = this.supabase.client
      .channel('active-orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => callback())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => callback())
      .subscribe();

    return () => {
      this.supabase.client.removeChannel(channel);
    };
  }

  async updateKitchenStatus(orderId: string, status: 'pending' | 'preparing' | 'ready') {
    const { error } = await this.supabase.client
      .from('orders')
      .update({ kitchen_status: status })
      .eq('id', orderId);
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
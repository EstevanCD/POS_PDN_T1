import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { InventoryItem, InventoryMovement } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  constructor(private supabase: SupabaseService) {}

  async getItems(): Promise<InventoryItem[]> {
    const { data, error } = await this.supabase.client
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data as InventoryItem[];
  }

  async createItem(item: Partial<InventoryItem>) {
    const { data, error } = await this.supabase.client.from('inventory_items').insert(item).select().single();
    if (error) throw error;
    return data as InventoryItem;
  }

  async updateItem(id: string, changes: Partial<InventoryItem>) {
    const { data, error } = await this.supabase.client
      .from('inventory_items')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as InventoryItem;
  }

  async deleteItem(id: string) {
    const { error } = await this.supabase.client.from('inventory_items').delete().eq('id', id);
    if (error) throw error;
  }

  async registerMovement(movement: InventoryMovement) {
    const { error } = await this.supabase.client.from('inventory_movements').insert(movement);
    if (error) throw error;
  }

  /** Valor total del inventario (suma cantidad * costo unitario) */
  async getInventoryValue(): Promise<number> {
    const items = await this.getItems();
    return items.reduce((acc, i) => acc + i.quantity * i.cost_per_unit, 0);
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    const items = await this.getItems();
    return items.filter((i) => i.quantity <= i.min_quantity);
  }
}

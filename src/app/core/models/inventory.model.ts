export interface InventoryItem {
  id?: string;
  name: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost_per_unit: number;
  updated_at?: string;
}

export interface InventoryMovement {
  id?: string;
  inventory_item_id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  created_at?: string;
}

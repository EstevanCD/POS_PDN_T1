export interface RecipeEntry {
  id?: string;
  product_id: string;
  inventory_item_id: string;
  inventory_item_name?: string;
  inventory_item_unit?: string;
  quantity_used: number;
  unit: string;
}
export type OrderStatus = 'open' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer';
export type DiscountType = 'percentage' | 'fixed';

export interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export type KitchenStatus = 'pending' | 'preparing' | 'ready';

export interface Order {
  id?: string;
  order_number?: number;
  customer_name?: string;
  customer_phone?: string;
  table_number?: string;
  channel?: 'pos' | 'feria';
  status: OrderStatus;
  kitchen_status?: KitchenStatus;
  payment_method?: PaymentMethod | 'mixed';
  payments?: PaymentSplit[];
  subtotal?: number;
  discount_type?: DiscountType | null;
  discount_value?: number;
  discount_reason?: string;
  total: number;
  items: OrderItem[];
  created_at?: string;
  closed_at?: string;
}
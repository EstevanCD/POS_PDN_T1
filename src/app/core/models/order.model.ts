export type OrderStatus = 'open' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer';

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
}

export interface Order {
  id?: string;
  order_number?: number;
  customer_name?: string;
  customer_phone?: string;
  table_number?: string;
  status: OrderStatus;
  payment_method?: PaymentMethod | 'mixed';
  payments?: PaymentSplit[];
  total: number;
  items: OrderItem[];
  created_at?: string;
  closed_at?: string;
}
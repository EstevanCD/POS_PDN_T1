import { PaymentMethod } from './order.model';

export type ExpenseCategory = 'insumos' | 'servicios' | 'nomina' | 'renta' | 'mantenimiento' | 'otros';
export type ExpensePaymentMethod = PaymentMethod | 'other';

export interface Expense {
  id?: string;
  concept: string;
  category: ExpenseCategory;
  payment_method: ExpensePaymentMethod;
  amount: number;
  date: string;
  created_at?: string;
}
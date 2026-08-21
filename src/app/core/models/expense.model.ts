export type ExpenseCategory = 'insumos' | 'servicios' | 'nomina' | 'renta' | 'mantenimiento' | 'otros';

export interface Expense {
  id?: string;
  concept: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  created_at?: string;
}

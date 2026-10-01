import { PaymentMethod } from '../models/order.model';
import { UserRole } from '../models/profile.model';
import { ExpenseCategory } from '../models/expense.model';

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  mixed: 'Pago mixto',
  other: 'Otro',
};

export function paymentMethodLabel(method?: string | null): string {
  if (!method) return '—';
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  cajero: 'Cajero',
  barista: 'Barista',
  mesero: 'Mesero',
  cocinero: 'Cocinero',
  cafeferias: 'Café Ferias',
};

export function roleLabel(role?: string | null): string {
  if (!role) return '—';
  return ROLE_LABELS[role as UserRole] ?? role;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  insumos: 'Insumos',
  servicios: 'Servicios',
  nomina: 'Nómina',
  renta: 'Renta',
  mantenimiento: 'Mantenimiento',
  otros: 'Otros',
};

export function expenseCategoryLabel(category?: string | null): string {
  if (!category) return '—';
  return EXPENSE_CATEGORY_LABELS[category as ExpenseCategory] ?? category;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  open: 'Activa',
  paid: 'Pagada',
  cancelled: 'Cancelada',
};

export function orderStatusLabel(status?: string | null): string {
  if (!status) return '—';
  return ORDER_STATUS_LABELS[status] ?? status;
}
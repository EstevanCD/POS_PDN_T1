import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Expense } from '../models/expense.model';
import { OrderService } from './order.service';
import { InventoryService } from './inventory.service';
import { Order } from '../models/order.model';

export interface MonthlySummary {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  ordersCount: number;
  inventoryValue: number;
  salesByDay: { day: string; total: number }[];
  expensesByCategory: { category: string; total: number }[];
  topProducts: { name: string; quantity: number; total: number }[];
}

export interface DailySummary {
  date: string;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  ordersCount: number;
  orders: Order[];
  expenses: Expense[];
}

@Injectable({ providedIn: 'root' })
export class FinanceService {
  constructor(
    private supabase: SupabaseService,
    private orderService: OrderService,
    private inventoryService: InventoryService
  ) { }

  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await this.supabase.client
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data as Expense[];
  }

  async createExpense(expense: Partial<Expense>) {
    const { data, error } = await this.supabase.client.from('expenses').insert(expense).select().single();
    if (error) throw error;
    return data as Expense;
  }

  async deleteExpense(id: string) {
    const { error } = await this.supabase.client.from('expenses').delete().eq('id', id);
    if (error) throw error;
  }

  async getExpensesBetween(startISO: string, endISO: string): Promise<Expense[]> {
    const { data, error } = await this.supabase.client
      .from('expenses')
      .select('*')
      .gte('date', startISO)
      .lte('date', endISO);
    if (error) throw error;
    return data as Expense[];
  }

  /** Arma el resumen mensual combinando ventas + gastos + inventario */
  async getMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const [orders, expenses, inventoryValue] = await Promise.all([
      this.orderService.getOrdersBetween(start.toISOString(), end.toISOString()),
      this.getExpensesBetween(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)),
      this.inventoryService.getInventoryValue(),
    ]);

    const paidOrders = orders.filter((o) => o.status === 'paid');
    const totalSales = paidOrders.reduce((acc, o) => acc + o.total, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    const salesByDayMap = new Map<string, number>();
    paidOrders.forEach((o) => {
      const day = (o.created_at ?? '').slice(0, 10);
      salesByDayMap.set(day, (salesByDayMap.get(day) ?? 0) + o.total);
    });
    const salesByDay = Array.from(salesByDayMap.entries())
      .map(([day, total]) => ({ day, total }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const expensesByCategoryMap = new Map<string, number>();
    expenses.forEach((e) => {
      expensesByCategoryMap.set(e.category, (expensesByCategoryMap.get(e.category) ?? 0) + e.amount);
    });
    const expensesByCategory = Array.from(expensesByCategoryMap.entries()).map(([category, total]) => ({
      category,
      total,
    }));

    const productMap = new Map<string, { name: string; quantity: number; total: number }>();
    paidOrders.forEach((o) =>
      o.items.forEach((it) => {
        const curr = productMap.get(it.product_name) ?? { name: it.product_name, quantity: 0, total: 0 };
        curr.quantity += it.quantity;
        curr.total += it.subtotal;
        productMap.set(it.product_name, curr);
      })
    );
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalSales,
      totalExpenses,
      netProfit: totalSales - totalExpenses,
      ordersCount: paidOrders.length,
      inventoryValue,
      salesByDay,
      expensesByCategory,
      topProducts,
    };
  }

  /** Resumen de un solo día: ventas, gastos y utilidad neta */
  async getDailySummary(dateISO: string): Promise<DailySummary> {
    const start = new Date(dateISO + 'T00:00:00');
    const end = new Date(dateISO + 'T23:59:59');

    const [orders, expenses] = await Promise.all([
      this.orderService.getOrdersBetween(start.toISOString(), end.toISOString()),
      this.getExpensesBetween(dateISO, dateISO),
    ]);

    const paidOrders = orders.filter((o) => o.status === 'paid');
    const totalSales = paidOrders.reduce((acc, o) => acc + o.total, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    return {
      date: dateISO,
      totalSales,
      totalExpenses,
      netProfit: totalSales - totalExpenses,
      ordersCount: paidOrders.length,
      orders: paidOrders,
      expenses,
    };
  }
}

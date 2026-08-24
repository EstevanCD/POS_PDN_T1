import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Expense } from '../../core/models/expense.model';
import { FinanceService } from '../../core/services/finance.service';
import { ExpenseFormComponent } from '../../shared/molecules/expense-form/expense-form.component';
import { ExpenseTableComponent } from '../../shared/organisms/expense-table/expense-table.component';
import { StatCardComponent } from '../../shared/molecules/stat-card/stat-card.component';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { BadgeComponent } from '../../shared/atoms/badge/badge.component';
import { SpinnerComponent } from '../../shared/atoms/spinner/spinner.component';
import { AuthService } from '../../core/services/auth.service';
import { hasPermission } from '../../core/utils/permissions';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { LabelPipe } from '../../shared/pipes/label.pipe';

type FilterMode = 'all' | 'today' | 'month' | 'range';

@Component({
  selector: 'app-finance-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ExpenseFormComponent,
    ExpenseTableComponent,
    StatCardComponent,
    CardComponent,
    BadgeComponent,
    SpinnerComponent,
    AppCurrencyPipe,
    LabelPipe,
  ],
  template: `
    <div class="finance-page container-page">
      <h2 class="finance-page__title">💰 Finanzas</h2>

      <app-card class="finance-page__filter-card">
        <div class="finance-page__filter-buttons">
          <button
            class="finance-page__filter-btn"
            [class.finance-page__filter-btn--active]="filterMode() === 'all'"
            (click)="setFilterMode('all')"
          >
            Todos
          </button>
          <button
            class="finance-page__filter-btn"
            [class.finance-page__filter-btn--active]="filterMode() === 'today'"
            (click)="setFilterMode('today')"
          >
            Hoy
          </button>
          <button
            class="finance-page__filter-btn"
            [class.finance-page__filter-btn--active]="filterMode() === 'month'"
            (click)="setFilterMode('month')"
          >
            Este mes
          </button>
          <button
            class="finance-page__filter-btn"
            [class.finance-page__filter-btn--active]="filterMode() === 'range'"
            (click)="setFilterMode('range')"
          >
            Rango personalizado
          </button>
        </div>

        <div class="finance-page__range" *ngIf="filterMode() === 'range'">
          <label>
            <span>Desde</span>
            <input type="date" [(ngModel)]="fromDate" name="fromDate" (ngModelChange)="load()" />
          </label>
          <label>
            <span>Hasta</span>
            <input type="date" [(ngModel)]="toDate" name="toDate" (ngModelChange)="load()" />
          </label>
        </div>
      </app-card>

      <div class="finance-page__stats">
        <app-stat-card icon="📉" label="Gasto total del período" [value]="totalExpenses() | appCurrency" tone="danger"></app-stat-card>
        <app-stat-card icon="🧾" label="Movimientos" [value]="expenses().length.toString()" tone="info"></app-stat-card>
      </div>

      <app-card class="finance-page__breakdown-card" *ngIf="expenses().length">
        <h3>Desglose por método de pago</h3>
        <div class="finance-page__breakdown-list">
          <div class="finance-page__breakdown-row" *ngFor="let row of paymentBreakdown()">
            <app-badge tone="neutral">{{ row.method | appLabel: 'payment' }}</app-badge>
            <span>{{ row.total | appCurrency }}</span>
          </div>
        </div>
      </app-card>

      <app-card class="finance-page__form-card" *ngIf="canEdit()">
        <h3>Registrar nuevo gasto</h3>
        <app-expense-form (create)="addExpense($event)"></app-expense-form>
      </app-card>

      <div class="finance-page__loading" *ngIf="loading()"><app-spinner></app-spinner></div>

      <app-expense-table *ngIf="!loading()" [expenses]="expenses()" (delete)="removeExpense($event)"></app-expense-table>
    </div>
  `,
  styles: [`
    .finance-page__title { margin-bottom: var(--space-4); }

    .finance-page__filter-card { margin-bottom: var(--space-4); }
    .finance-page__filter-buttons { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .finance-page__filter-btn {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-full);
      border: 1.5px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text-muted);
      font-weight: 600;
      font-size: var(--fs-sm);
      cursor: pointer;
    }
    .finance-page__filter-btn--active {
      background: var(--color-primary);
      color: var(--color-text-inverse);
      border-color: var(--color-primary);
    }
    .finance-page__range {
      display: flex; gap: var(--space-3); margin-top: var(--space-3); flex-wrap: wrap;
    }
    .finance-page__range label {
      display: flex; flex-direction: column; gap: 4px;
      font-size: var(--fs-xs); color: var(--color-text-muted); font-weight: 600;
    }
    .finance-page__range input {
      border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-2); font-size: var(--fs-sm);
    }

    .finance-page__stats {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3);
      margin-bottom: var(--space-4); max-width: 560px;
    }

    .finance-page__breakdown-card { margin-bottom: var(--space-5); max-width: 560px; }
    .finance-page__breakdown-card h3 { margin-bottom: var(--space-3); }
    .finance-page__breakdown-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-2) 0; border-bottom: 1px dashed var(--color-border);
      font-weight: 600;
    }

    .finance-page__form-card { margin-bottom: var(--space-5); }
    .finance-page__form-card h3 { margin-bottom: var(--space-3); }
    .finance-page__loading { display: flex; justify-content: center; padding: var(--space-8); }

    @media (max-width: 480px) {
      .finance-page__stats { grid-template-columns: 1fr; }
    }
  `],
})
export class FinancePage implements OnInit {
  expenses = signal<Expense[]>([]);
  loading = signal(true);
  filterMode = signal<FilterMode>('all');

  fromDate = new Date().toISOString().slice(0, 10);
  toDate = new Date().toISOString().slice(0, 10);

  constructor(private financeService: FinanceService, private auth: AuthService) { }

  canEdit(): boolean {
    return hasPermission(this.auth.profile()?.role, 'finance:edit');
  }

  async ngOnInit() {
    await this.load();
  }

  setFilterMode(mode: FilterMode) {
    this.filterMode.set(mode);
    if (mode === 'range') {
      this.fromDate = new Date().toISOString().slice(0, 10);
      this.toDate = new Date().toISOString().slice(0, 10);
    }
    this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const mode = this.filterMode();
      if (mode === 'all') {
        this.expenses.set(await this.financeService.getExpenses());
      } else if (mode === 'today') {
        const today = new Date().toISOString().slice(0, 10);
        this.expenses.set(await this.financeService.getExpensesBetween(today, today));
      } else if (mode === 'month') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        this.expenses.set(await this.financeService.getExpensesBetween(start, end));
      } else {
        this.expenses.set(await this.financeService.getExpensesBetween(this.fromDate, this.toDate));
      }
    } finally {
      this.loading.set(false);
    }
  }

  totalExpenses(): number {
    return this.expenses().reduce((acc, e) => acc + e.amount, 0);
  }

  paymentBreakdown(): { method: string; total: number }[] {
    const map = new Map<string, number>();
    this.expenses().forEach((e) => {
      map.set(e.payment_method, (map.get(e.payment_method) ?? 0) + e.amount);
    });
    return Array.from(map.entries()).map(([method, total]) => ({ method, total }));
  }

  async addExpense(payload: Partial<Expense>) {
    await this.financeService.createExpense(payload);
    await this.load();
  }

  async removeExpense(expense: Expense) {
    if (!expense.id || !confirm(`¿Eliminar el gasto "${expense.concept}"?`)) return;
    await this.financeService.deleteExpense(expense.id);
    await this.load();
  }
}
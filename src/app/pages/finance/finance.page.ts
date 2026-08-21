import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Expense } from '../../core/models/expense.model';
import { FinanceService } from '../../core/services/finance.service';
import { ExpenseFormComponent } from '../../shared/molecules/expense-form/expense-form.component';
import { ExpenseTableComponent } from '../../shared/organisms/expense-table/expense-table.component';
import { StatCardComponent } from '../../shared/molecules/stat-card/stat-card.component';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { SpinnerComponent } from '../../shared/atoms/spinner/spinner.component';
import { AuthService } from '../../core/services/auth.service';
import { hasPermission } from '../../core/utils/permissions';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-finance-page',
  standalone: true,
  imports: [
    CommonModule,
    ExpenseFormComponent,
    ExpenseTableComponent,
    StatCardComponent,
    CardComponent,
    SpinnerComponent,
    AppCurrencyPipe,
  ],
  template: `
    <div class="finance-page container-page">
      <h2 class="finance-page__title">💰 Finanzas</h2>

      <div class="finance-page__stats">
                <app-stat-card icon="📉" label="Gasto total registrado" [value]="totalExpenses() | appCurrency" tone="danger"></app-stat-card>
        <app-stat-card icon="🧾" label="Movimientos" [value]="expenses().length.toString()" tone="info"></app-stat-card>
      </div>

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
    .finance-page__stats {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3);
      margin-bottom: var(--space-5); max-width: 560px;
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

  constructor(private financeService: FinanceService, private auth: AuthService) { }

  canEdit(): boolean {
    return hasPermission(this.auth.profile()?.role, 'finance:edit');
  }

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      this.expenses.set(await this.financeService.getExpenses());
    } finally {
      this.loading.set(false);
    }
  }

  totalExpenses(): number {
    return this.expenses().reduce((acc, e) => acc + e.amount, 0);
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

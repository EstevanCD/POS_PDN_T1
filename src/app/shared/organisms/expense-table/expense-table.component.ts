import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Expense } from '../../../core/models/expense.model';
import { BadgeComponent } from '../../atoms/badge/badge.component';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';
import { LabelPipe } from '../../pipes/label.pipe';

@Component({
  selector: 'app-expense-table',
  standalone: true,
  imports: [CommonModule, BadgeComponent, AppCurrencyPipe, LabelPipe],
  template: `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Concepto</th>
            <th>Categoría</th>
            <th>Monto</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let e of expenses">
            <td>{{ e.date | date: 'dd/MM/yyyy' }}</td>
            <td class="table__name">{{ e.concept }}</td>
            <td><app-badge tone="info">{{ e.category | appLabel: 'expenseCategory' }}</app-badge></td>
            <td>{{ e.amount | appCurrency }}</td>
            <td class="table__actions">
              <button (click)="delete.emit(e)" aria-label="Eliminar">🗑️</button>
            </td>
          </tr>
          <tr *ngIf="!expenses.length">
            <td colspan="5" class="table__empty">Aún no hay gastos registrados este período.</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styleUrl: '../../shared-table.scss',
})
export class ExpenseTableComponent {
  @Input() expenses: Expense[] = [];
  @Output() delete = new EventEmitter<Expense>();
}

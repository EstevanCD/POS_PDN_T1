import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../atoms/button/button.component';
import { Expense, ExpenseCategory } from '../../../core/models/expense.model';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  template: `
    <form class="exp-form" (ngSubmit)="submit()">
      <div class="exp-form__grid">
        <label class="exp-form__field">
          <span>Concepto</span>
          <input type="text" [(ngModel)]="concept" name="concept" placeholder="Ej. Café en grano" required />
        </label>
        <label class="exp-form__field">
          <span>Categoría</span>
          <select [(ngModel)]="category" name="category">
            <option value="insumos">Insumos</option>
            <option value="servicios">Servicios</option>
            <option value="nomina">Nómina</option>
            <option value="renta">Renta</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="otros">Otros</option>
          </select>
        </label>
        <label class="exp-form__field">
          <span>Monto</span>
          <input type="number" step="0.01" min="0" [(ngModel)]="amount" name="amount" required />
        </label>
        <label class="exp-form__field">
          <span>Fecha</span>
          <input type="date" [(ngModel)]="date" name="date" required />
        </label>
      </div>
      <app-button type="submit" [full]="true">➕ Registrar gasto</app-button>
    </form>
  `,
  styles: [`
    .exp-form__grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }
    .exp-form__field {
      display: flex; flex-direction: column; gap: 4px;
      font-size: var(--fs-sm); font-weight: 600; color: var(--color-text-muted);
    }
    .exp-form__field input, .exp-form__field select {
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      font-size: var(--fs-md);
      color: var(--color-text);
      background: var(--color-surface);
    }
    @media (max-width: 560px) {
      .exp-form__grid { grid-template-columns: 1fr; }
    }
  `],
})
export class ExpenseFormComponent {
  concept = '';
  category: ExpenseCategory = 'insumos';
  amount: number | null = null;
  date = new Date().toISOString().slice(0, 10);

  @Output() create = new EventEmitter<Partial<Expense>>();

  submit() {
    if (!this.concept || !this.amount) return;
    this.create.emit({
      concept: this.concept,
      category: this.category,
      amount: this.amount,
      date: this.date,
    });
    this.concept = '';
    this.amount = null;
  }
}

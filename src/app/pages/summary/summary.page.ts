import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, MonthlySummary } from '../../core/services/finance.service';
import { StatCardComponent } from '../../shared/molecules/stat-card/stat-card.component';
import { SalesChartComponent } from '../../shared/organisms/sales-chart/sales-chart.component';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { BadgeComponent } from '../../shared/atoms/badge/badge.component';
import { SpinnerComponent } from '../../shared/atoms/spinner/spinner.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { LabelPipe } from '../../shared/pipes/label.pipe';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

@Component({
  selector: 'app-summary-page',
  standalone: true,
  imports: [CommonModule, FormsModule, StatCardComponent, SalesChartComponent, CardComponent, BadgeComponent, SpinnerComponent, AppCurrencyPipe, LabelPipe],
  template: `
    <div class="summary-page container-page">
      <div class="summary-page__header">
        <h2>📈 Resumen mensual</h2>
        <div class="summary-page__selector">
          <select [(ngModel)]="month" (ngModelChange)="load()">
            <option *ngFor="let m of monthNames; let i = index" [value]="i + 1">{{ m }}</option>
          </select>
          <select [(ngModel)]="year" (ngModelChange)="load()">
            <option *ngFor="let y of years" [value]="y">{{ y }}</option>
          </select>
        </div>
      </div>

      <div class="summary-page__loading" *ngIf="loading()"><app-spinner></app-spinner></div>

      <ng-container *ngIf="!loading() && summary() as s">
        <div class="summary-page__stats">
          <app-stat-card icon="💵" label="Ventas del mes" [value]="s.totalSales | appCurrency" tone="success"></app-stat-card>
          <app-stat-card icon="📉" label="Gastos del mes" [value]="s.totalExpenses | appCurrency" tone="danger"></app-stat-card>
          <app-stat-card
            icon="📊"
            label="Utilidad neta"
            [value]="s.netProfit | appCurrency"
            [tone]="s.netProfit >= 0 ? 'success' : 'danger'"
          ></app-stat-card>
          <app-stat-card icon="🧾" label="Órdenes cobradas" [value]="s.ordersCount.toString()" tone="info"></app-stat-card>
          <app-stat-card icon="📦" label="Valor de inventario" [value]="s.inventoryValue | appCurrency" tone="primary"></app-stat-card>
        </div>

        <div class="summary-page__grid">
          <app-card>
            <h3>Ventas por día</h3>
            <app-sales-chart [data]="s.salesByDay"></app-sales-chart>
          </app-card>

          <app-card>
            <h3>Gastos por categoría</h3>
            <div class="summary-page__cat-list" *ngIf="s.expensesByCategory.length; else noExpenses">
              <div class="summary-page__cat-row" *ngFor="let c of s.expensesByCategory">
                <app-badge tone="info">{{ c.category | appLabel: 'expenseCategory' }}</app-badge>
                <span>{{ c.total | appCurrency }}</span>
              </div>
            </div>
            <ng-template #noExpenses>
              <p class="summary-page__empty">Sin gastos registrados este mes.</p>
            </ng-template>
          </app-card>

          <app-card class="summary-page__wide">
            <h3>Productos más vendidos</h3>
            <div class="summary-page__top-list" *ngIf="s.topProducts.length; else noProducts">
              <div class="summary-page__top-row" *ngFor="let p of s.topProducts">
                <span class="summary-page__top-name">{{ p.name }}</span>
                <span class="summary-page__top-qty">{{ p.quantity }} unidades</span>
                <span class="summary-page__top-total">{{ p.total | appCurrency }}</span>
              </div>
            </div>
            <ng-template #noProducts>
              <p class="summary-page__empty">Sin ventas registradas este mes.</p>
            </ng-template>
          </app-card>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .summary-page__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3); }
    .summary-page__selector { display: flex; gap: var(--space-2); }
    .summary-page__selector select {
      border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-3); font-size: var(--fs-sm); background: var(--color-surface);
    }
    .summary-page__loading { display: flex; justify-content: center; padding: var(--space-8); }

    .summary-page__stats {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-3);
      margin-bottom: var(--space-5);
    }
    .summary-page__grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);
    }
    .summary-page__wide { grid-column: 1 / -1; }
    .summary-page__grid h3 { margin-bottom: var(--space-3); }

    .summary-page__cat-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-2) 0; border-bottom: 1px dashed var(--color-border);
      font-weight: 600;
    }
    .summary-page__top-row {
      display: grid; grid-template-columns: 2fr 1fr 1fr; gap: var(--space-2);
      padding: var(--space-2) 0; border-bottom: 1px dashed var(--color-border);
      font-size: var(--fs-sm);
    }
    .summary-page__top-name { font-weight: 700; }
    .summary-page__top-qty, .summary-page__top-total { color: var(--color-text-muted); }
    .summary-page__empty { color: var(--color-text-muted); text-align: center; padding: var(--space-5); }

    @media (max-width: 1024px) {
      .summary-page__stats { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .summary-page__grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
      .summary-page__stats { grid-template-columns: 1fr; }
    }
  `],
})
export class SummaryPage implements OnInit {
  monthNames = MONTH_NAMES;
  years = [2024, 2025, 2026, 2027];

  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();

  summary = signal<MonthlySummary | null>(null);
  loading = signal(true);

  constructor(private financeService: FinanceService) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      this.summary.set(await this.financeService.getMonthlySummary(this.year, this.month));
    } finally {
      this.loading.set(false);
    }
  }
}

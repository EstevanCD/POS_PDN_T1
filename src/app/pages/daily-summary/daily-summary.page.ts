import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, DailySummary } from '../../core/services/finance.service';
import { StatCardComponent } from '../../shared/molecules/stat-card/stat-card.component';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { BadgeComponent } from '../../shared/atoms/badge/badge.component';
import { SpinnerComponent } from '../../shared/atoms/spinner/spinner.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { Order } from '../../core/models/order.model';
import { OrderDetailModalComponent } from '../../shared/organisms/order-detail-modal/order-detail-modal.component';

@Component({
  selector: 'app-daily-summary-page',
  standalone: true,
  imports: [CommonModule, FormsModule, StatCardComponent, CardComponent, BadgeComponent, SpinnerComponent, AppCurrencyPipe, LabelPipe, OrderDetailModalComponent],
  template: `
    <div class="daily-summary container-page">
      <div class="daily-summary__header">
        <h2>📅 Resumen diario</h2>
        <input type="date" [(ngModel)]="selectedDate" (ngModelChange)="load()" />
      </div>

      <div class="daily-summary__loading" *ngIf="loading()"><app-spinner></app-spinner></div>

      <ng-container *ngIf="!loading() && summary() as s">
        <div class="daily-summary__stats">
          <app-stat-card icon="💵" label="Ventas de hoy" [value]="s.totalSales | appCurrency" tone="success"></app-stat-card>
          <app-stat-card icon="📉" label="Gastos de hoy" [value]="s.totalExpenses | appCurrency" tone="danger"></app-stat-card>
          <app-stat-card
            icon="📊"
            label="Utilidad neta"
            [value]="s.netProfit | appCurrency"
            [tone]="s.netProfit >= 0 ? 'success' : 'danger'"
          ></app-stat-card>
          <app-stat-card icon="🧾" label="Órdenes cobradas" [value]="s.ordersCount.toString()" tone="info"></app-stat-card>
        </div>

        <div class="daily-summary__grid">
          <app-card>
            <h3>Ventas del día</h3>
            <div class="daily-summary__list" *ngIf="s.orders.length; else noSales">
              <button class="daily-summary__row daily-summary__row--clickable" *ngFor="let o of s.orders" (click)="viewOrder(o)">
                <span>#{{ o.order_number }} · {{ o.created_at | date: 'shortTime' }}</span>
                <app-badge tone="info">{{ o.payment_method | appLabel: 'payment' }}</app-badge>
                <span>{{ o.total | appCurrency }}</span>
              </button>
            </div>
            <ng-template #noSales><p class="daily-summary__empty">Sin ventas hoy.</p></ng-template>
          </app-card>

          <app-card>
            <h3>Gastos del día</h3>
            <div class="daily-summary__list" *ngIf="s.expenses.length; else noExpenses">
              <div class="daily-summary__row" *ngFor="let e of s.expenses">
                <span>{{ e.concept }}</span>
                  <app-badge tone="warning">{{ e.category | appLabel: 'expenseCategory' }}</app-badge>
                <span>{{ e.amount | appCurrency }}</span>
              </div>
            </div>
            <ng-template #noExpenses><p class="daily-summary__empty">Sin gastos hoy.</p></ng-template>
          </app-card>
        </div>
      </ng-container>
    </div>
    <app-order-detail-modal *ngIf="selectedOrder()" [order]="selectedOrder()!" (close)="selectedOrder.set(null)"></app-order-detail-modal>
  `,
  styles: [`
    .daily-summary__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3); }
    .daily-summary__header input {
      border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-3); font-size: var(--fs-sm);
    }
    .daily-summary__loading { display: flex; justify-content: center; padding: var(--space-8); }
    .daily-summary__stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3); margin-bottom: var(--space-5); }
    .daily-summary__grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .daily-summary__grid h3 { margin-bottom: var(--space-3); }
    .daily-summary__row {
      display: grid; grid-template-columns: 2fr auto 1fr; align-items: center; gap: var(--space-2);
      padding: var(--space-2) 0; border-bottom: 1px dashed var(--color-border); font-size: var(--fs-sm);
    }
    .daily-summary__row--clickable {
      width: 100%;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      color: inherit;
      border-radius: var(--radius-sm);
      transition: background 0.12s ease;
    }
    .daily-summary__row--clickable:hover {
      background: var(--color-surface-alt);
    }
    .daily-summary__empty { color: var(--color-text-muted); text-align: center; padding: var(--space-5); }

    @media (max-width: 1024px) { .daily-summary__stats { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .daily-summary__grid { grid-template-columns: 1fr; } }
    @media (max-width: 480px) { .daily-summary__stats { grid-template-columns: 1fr; } }
  `],
})
export class DailySummaryPage implements OnInit {
  selectedDate = new Date().toISOString().slice(0, 10);
  summary = signal<DailySummary | null>(null);
  loading = signal(true);
  selectedOrder = signal<Order | null>(null);

  constructor(private financeService: FinanceService) { }

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      this.summary.set(await this.financeService.getDailySummary(this.selectedDate));
    } finally {
      this.loading.set(false);
    }
  }

  viewOrder(order: Order) {
    this.selectedOrder.set(order);
  }
}
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { BadgeComponent } from '../../shared/atoms/badge/badge.component';
import { SpinnerComponent } from '../../shared/atoms/spinner/spinner.component';
import { StatCardComponent } from '../../shared/molecules/stat-card/stat-card.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { LabelPipe } from '../../shared/pipes/label.pipe';

type FeriaRange = 'today' | 'week';

@Component({
    selector: 'app-feria-sales-page',
    standalone: true,
    imports: [CommonModule, CardComponent, BadgeComponent, SpinnerComponent, StatCardComponent, AppCurrencyPipe, LabelPipe],
    template: `
    <div class="feria-sales container-page">
      <h2>🎪 Ventas — Café Ferias</h2>

      <div class="feria-sales__tabs">
        <button class="feria-sales__tab" [class.feria-sales__tab--active]="range() === 'today'" (click)="setRange('today')">Hoy</button>
        <button class="feria-sales__tab" [class.feria-sales__tab--active]="range() === 'week'" (click)="setRange('week')">Últimos 7 días</button>
      </div>

      <div class="feria-sales__stats">
        <app-stat-card icon="💵" label="Total vendido" [value]="totalSales() | appCurrency" tone="success"></app-stat-card>
        <app-stat-card icon="🧾" label="Ventas registradas" [value]="orders().length.toString()" tone="info"></app-stat-card>
      </div>

      <div class="feria-sales__loading" *ngIf="loading()"><app-spinner></app-spinner></div>

      <div class="feria-sales__list" *ngIf="!loading()">
        <app-card *ngFor="let o of orders()" padding="sm" class="feria-sales__row">
          <div class="feria-sales__main">
            <p class="feria-sales__desc">{{ describe(o) }}</p>
            <p class="feria-sales__time">{{ o.created_at | date: 'short' }}</p>
          </div>
          <div class="feria-sales__meta">
            <app-badge tone="neutral" *ngIf="o.table_number">📍 {{ o.table_number }}</app-badge>
            <app-badge tone="info">{{ o.payment_method | appLabel: 'payment' }}</app-badge>
            <span class="feria-sales__amount">{{ o.total | appCurrency }}</span>
          </div>
        </app-card>
        <p class="feria-sales__empty" *ngIf="!orders().length">No hay ventas de Café Ferias en este período.</p>
      </div>
    </div>
  `,
    styles: [`
    .feria-sales h2 { margin-bottom: var(--space-3); }
    .feria-sales__tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); }
    .feria-sales__tab {
      padding: var(--space-2) var(--space-4); border-radius: var(--radius-full);
      border: 1.5px solid var(--color-border); background: var(--color-surface);
      color: var(--color-text-muted); font-weight: 600; font-size: var(--fs-sm); cursor: pointer;
    }
    .feria-sales__tab--active { background: var(--color-primary); color: var(--color-text-inverse); border-color: var(--color-primary); }

    .feria-sales__stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); margin-bottom: var(--space-5); max-width: 560px; }
    .feria-sales__loading { display: flex; justify-content: center; padding: var(--space-8); }

    .feria-sales__list { display: flex; flex-direction: column; gap: var(--space-3); }
    .feria-sales__row { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
    .feria-sales__main { min-width: 0; flex: 1; }
    .feria-sales__desc { font-weight: 600; font-size: var(--fs-sm); overflow-wrap: break-word; }
    .feria-sales__time { font-size: var(--fs-xs); color: var(--color-text-muted); }
    .feria-sales__meta { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
    .feria-sales__amount { font-weight: 700; font-size: var(--fs-md); }
    .feria-sales__empty { color: var(--color-text-muted); text-align: center; padding: var(--space-8); }

    @media (max-width: 480px) { .feria-sales__stats { grid-template-columns: 1fr; } }
  `],
})
export class FeriaSalesPage implements OnInit {
    range = signal<FeriaRange>('today');
    orders = signal<Order[]>([]);
    loading = signal(true);

    constructor(private orderService: OrderService) { }

    async ngOnInit() {
        await this.load();
    }

    setRange(range: FeriaRange) {
        this.range.set(range);
        this.load();
    }

    async load() {
        this.loading.set(true);
        try {
            const now = new Date();
            let start: Date;
            if (this.range() === 'today') {
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else {
                start = new Date(now);
                start.setDate(start.getDate() - 6);
                start.setHours(0, 0, 0, 0);
            }
            this.orders.set(await this.orderService.getFeriaSalesBetween(start.toISOString(), now.toISOString()));
        } finally {
            this.loading.set(false);
        }
    }

    totalSales(): number {
        return this.orders().reduce((acc, o) => acc + o.total, 0);
    }

    describe(order: Order): string {
        return order.items.map((i) => `${i.quantity}× ${i.product_name}`).join(', ');
    }
}
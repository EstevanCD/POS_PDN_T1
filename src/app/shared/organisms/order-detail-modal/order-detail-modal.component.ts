import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../../core/models/order.model';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';
import { LabelPipe } from '../../pipes/label.pipe';
import { ButtonComponent } from '../../atoms/button/button.component';
import { BadgeComponent } from '../../atoms/badge/badge.component';

@Component({
  selector: 'app-order-detail-modal',
  standalone: true,
  imports: [CommonModule, AppCurrencyPipe, LabelPipe, ButtonComponent, BadgeComponent],
  template: `
    <div class="order-detail__backdrop" (click)="close.emit()">
      <div class="order-detail" (click)="$event.stopPropagation()">
        <div class="order-detail__header">
          <div>
            <h3>{{ order.table_number || 'Sin mesa' }} · Orden #{{ order.order_number }}</h3>
            <p class="order-detail__time">{{ order.created_at | date: 'medium' }}</p>
          </div>
          <button class="order-detail__close" (click)="close.emit()" aria-label="Cerrar">✕</button>
        </div>

        <div class="order-detail__items">
          <div class="order-detail__row" *ngFor="let item of order.items">
            <div class="order-detail__item-info">
              <span class="order-detail__qty">{{ item.quantity }}×</span>
              <span class="order-detail__name">{{ item.product_name }}</span>
            </div>
            <div class="order-detail__item-amounts">
              <span class="order-detail__unit-price">{{ item.unit_price | appCurrency }} c/u</span>
              <span class="order-detail__subtotal">{{ item.subtotal | appCurrency }}</span>
            </div>
          </div>
          <p class="order-detail__empty" *ngIf="!order.items.length">Esta orden no tiene productos registrados.</p>
        </div>

        <div class="order-detail__total">
          <span>Total</span>
          <span>{{ order.total | appCurrency }}</span>
        </div>

        <div class="order-detail__meta">
          <div class="order-detail__meta-row" *ngIf="order.payments && order.payments.length > 1; else singlePayment">
            <span class="order-detail__meta-label">Métodos de pago:</span>
            <div class="order-detail__payments">
              <app-badge tone="neutral" *ngFor="let p of order.payments">
                {{ p.method | appLabel: 'payment' }} · {{ p.amount | appCurrency }}
              </app-badge>
            </div>
          </div>
          <ng-template #singlePayment>
            <div class="order-detail__meta-row" *ngIf="order.payment_method">
              <span class="order-detail__meta-label">Método de pago:</span>
              <app-badge tone="neutral">{{ order.payment_method | appLabel: 'payment' }}</app-badge>
            </div>
          </ng-template>

          <div class="order-detail__meta-row" *ngIf="order.customer_phone">
            <span class="order-detail__meta-label">Cliente:</span>
            <span>📱 {{ order.customer_phone }}</span>
          </div>
        </div>

        <app-button [full]="true" (clicked)="close.emit()">Cerrar</app-button>
      </div>
    </div>
  `,
  styles: [`
    .order-detail__backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 100; padding: var(--space-4);
    }
    .order-detail {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      max-width: 440px; width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      display: flex; flex-direction: column; gap: var(--space-4);
    }
    .order-detail__header {
      display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-3);
    }
    .order-detail__header h3 { font-size: var(--fs-lg); }
    .order-detail__time { color: var(--color-text-muted); font-size: var(--fs-sm); margin-top: 2px; }
    .order-detail__close {
      border: none; background: var(--color-surface-alt); border-radius: 50%;
      width: 32px; height: 32px; flex-shrink: 0; cursor: pointer; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
    }

    .order-detail__items {
      display: flex; flex-direction: column; gap: var(--space-1);
      max-height: 320px; overflow-y: auto;
    }
    .order-detail__row {
      display: flex; justify-content: space-between; align-items: center; gap: var(--space-3);
      padding: var(--space-2) 0; border-bottom: 1px dashed var(--color-border);
    }
    .order-detail__item-info { display: flex; gap: var(--space-2); align-items: baseline; min-width: 0; }
    .order-detail__qty { font-weight: 700; color: var(--color-primary); flex-shrink: 0; }
    .order-detail__name { font-weight: 600; font-size: var(--fs-sm); overflow-wrap: break-word; }
    .order-detail__item-amounts { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
    .order-detail__unit-price { font-size: var(--fs-xs); color: var(--color-text-muted); }
    .order-detail__subtotal { font-weight: 700; font-size: var(--fs-sm); }
    .order-detail__empty { color: var(--color-text-muted); text-align: center; padding: var(--space-4); font-size: var(--fs-sm); }

    .order-detail__total {
      display: flex; justify-content: space-between; align-items: center;
      font-weight: 700; font-size: var(--fs-xl); font-family: var(--font-heading);
      border-top: 1px solid var(--color-border); padding-top: var(--space-3);
    }

    .order-detail__meta { display: flex; flex-direction: column; gap: var(--space-2); }
    .order-detail__meta-row { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; font-size: var(--fs-sm); }
    .order-detail__meta-label { color: var(--color-text-muted); font-weight: 600; }
    .order-detail__payments { display: flex; gap: var(--space-1); flex-wrap: wrap; }

    @media (max-width: 480px) {
      .order-detail { padding: var(--space-4); max-height: 95vh; }
      .order-detail__items { max-height: 45vh; }
    }
  `],
})
export class OrderDetailModalComponent {
  @Input({ required: true }) order!: Order;
  @Output() close = new EventEmitter<void>();
}
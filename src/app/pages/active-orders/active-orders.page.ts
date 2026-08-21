import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Order, PaymentMethod, PaymentSplit } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { SettingsService } from '../../core/services/settings.service';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { SpinnerComponent } from '../../shared/atoms/spinner/spinner.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
//import { LabelPipe } from '../../shared/pipes/label.pipe';
import { TicketModalComponent } from '../../shared/organisms/ticket-modal/ticket-modal.component';

@Component({
  selector: 'app-active-orders-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, SpinnerComponent, AppCurrencyPipe, TicketModalComponent],
  template: `
    <div class="active-orders container-page">
      <h2>🕐 Órdenes activas</h2>
      <p class="active-orders__hint">Órdenes enviadas sin cobrar todavía (mesas, para llevar, etc.)</p>

      <div class="active-orders__loading" *ngIf="loading()"><app-spinner></app-spinner></div>

      <div class="active-orders__grid" *ngIf="!loading()">
        <app-card *ngFor="let order of orders()" class="active-orders__card">
          <div class="active-orders__header">
            <span class="active-orders__number">
              {{ order.table_number || 'Sin mesa' }} · #{{ order.order_number }}
            </span>
            <span class="active-orders__time">{{ order.created_at | date: 'shortTime' }}</span>
          </div>

          <ul class="active-orders__items">
            <li *ngFor="let item of order.items">
              {{ item.quantity }}× {{ item.product_name }}
              <span>{{ item.subtotal | appCurrency }}</span>
            </li>
          </ul>

          <div class="active-orders__total">
            <span>Total</span>
            <span>{{ order.total | appCurrency }}</span>
          </div>

          <app-button [full]="true" (clicked)="openCharge(order)">💳 Cobrar</app-button>
          <app-button variant="danger" size="sm" [full]="true" (clicked)="cancel(order)">Cancelar orden</app-button>
        </app-card>

        <p class="active-orders__empty" *ngIf="!orders().length">No hay órdenes activas en este momento.</p>
      </div>
    </div>

    <!-- Modal de cobro con pago dividido + teléfono de lealtad -->
    <div class="charge-modal__backdrop" *ngIf="chargingOrder()" (click)="chargingOrder.set(null)">
      <div class="charge-modal" (click)="$event.stopPropagation()">
        <h3>💳 Cobrar {{ chargingOrder()?.table_number || 'Sin mesa' }} · #{{ chargingOrder()?.order_number }}</h3>

        <div class="charge-modal__total">
          <span>Total a cobrar</span>
          <span>{{ chargingOrder()?.total | appCurrency }}</span>
        </div>

        <div class="charge-modal__field">
          <label>📱 Teléfono del cliente (opcional, para acumular puntos)</label>
          <input type="text" [(ngModel)]="customerPhone" name="customerPhone" placeholder="Ej. 3001234567" />
        </div>

        <div class="charge-modal__split-toggle">
          <button class="charge-modal__split-btn" [class.charge-modal__split-btn--active]="!splitMode" (click)="setSplitMode(false)">
            Un solo método
          </button>
          <button class="charge-modal__split-btn" [class.charge-modal__split-btn--active]="splitMode" (click)="setSplitMode(true)">
            Varios métodos
          </button>
        </div>

        <div class="charge-modal__payment" *ngIf="!splitMode">
          <button
            *ngFor="let m of paymentMethods"
            class="charge-modal__payment-btn"
            [class.charge-modal__payment-btn--active]="singleMethod === m.value"
            (click)="singleMethod = m.value"
          >
            {{ m.icon }} {{ m.label }}
          </button>
        </div>

        <div class="charge-modal__splits" *ngIf="splitMode">
          <div class="charge-modal__split-row" *ngFor="let row of splitRows; let i = index">
            <select [(ngModel)]="row.method" [name]="'splitMethod' + i">
              <option *ngFor="let m of paymentMethods" [value]="m.value">{{ m.icon }} {{ m.label }}</option>
            </select>
            <input type="number" min="0" step="0.01" [(ngModel)]="row.amount" [name]="'splitAmount' + i" placeholder="Monto" />
            <button class="charge-modal__split-remove" (click)="removeSplitRow(i)" *ngIf="splitRows.length > 1">✕</button>
          </div>
          <button class="charge-modal__split-add" (click)="addSplitRow()">➕ Agregar otro método</button>
          <div class="charge-modal__split-balance" [class.charge-modal__split-balance--error]="!splitBalanced()">
            <span>Asignado: {{ splitSum() | appCurrency }}</span>
            <span>Falta: {{ (chargingOrder()!.total - splitSum()) | appCurrency }}</span>
          </div>
        </div>

        <app-button
          [full]="true"
          size="lg"
          [loading]="chargingId() === chargingOrder()?.id"
          [disabled]="splitMode && !splitBalanced()"
          (clicked)="confirmCharge()"
        >
          Confirmar cobro
        </app-button>
        <app-button variant="ghost" [full]="true" (clicked)="chargingOrder.set(null)">Cancelar</app-button>
      </div>
    </div>

    <app-ticket-modal *ngIf="lastChargedOrder()" [order]="lastChargedOrder()!" (close)="lastChargedOrder.set(null)"></app-ticket-modal>
  `,
  styles: [`
    .active-orders h2 { margin-bottom: var(--space-1); }
    .active-orders__hint { color: var(--color-text-muted); font-size: var(--fs-sm); margin-bottom: var(--space-5); }
    .active-orders__loading { display: flex; justify-content: center; padding: var(--space-8); }
    .active-orders__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-4); }
    .active-orders__card { display: flex; flex-direction: column; gap: var(--space-3); }
    .active-orders__header { display: flex; justify-content: space-between; font-weight: 700; }
    .active-orders__time { color: var(--color-text-muted); font-weight: 400; font-size: var(--fs-sm); }
    .active-orders__items { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
    .active-orders__items li { display: flex; justify-content: space-between; font-size: var(--fs-sm); }
    .active-orders__total { display: flex; justify-content: space-between; font-weight: 700; font-size: var(--fs-lg); border-top: 1px dashed var(--color-border); padding-top: var(--space-2); }
    .active-orders__empty { color: var(--color-text-muted); grid-column: 1 / -1; text-align: center; padding: var(--space-8); }

    .charge-modal__backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: var(--space-4); }
    .charge-modal { background: var(--color-surface); border-radius: var(--radius-lg); padding: var(--space-5); max-width: 400px; width: 100%; max-height: 90vh; overflow-y: auto; }
    .charge-modal h3 { margin-bottom: var(--space-3); }
    .charge-modal__total { display: flex; justify-content: space-between; font-weight: 700; font-size: var(--fs-lg); margin-bottom: var(--space-4); }
    .charge-modal__field { margin-bottom: var(--space-3); display: flex; flex-direction: column; gap: 4px; }
    .charge-modal__field label { font-size: var(--fs-xs); color: var(--color-text-muted); font-weight: 600; }
    .charge-modal__field input { border: 1.5px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-2); font-size: var(--fs-sm); }

    .charge-modal__split-toggle { display: flex; gap: var(--space-2); margin-bottom: var(--space-3); }
    .charge-modal__split-btn { flex: 1; padding: var(--space-2); border-radius: var(--radius-md); border: 1.5px solid var(--color-border); background: var(--color-surface); font-size: var(--fs-xs); font-weight: 600; cursor: pointer; }
    .charge-modal__split-btn--active { border-color: var(--color-primary); background: var(--color-primary); color: var(--color-text-inverse); }

    .charge-modal__payment { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2); margin-bottom: var(--space-4); }
    .charge-modal__payment-btn { padding: var(--space-2); border-radius: var(--radius-md); border: 1.5px solid var(--color-border); background: var(--color-surface); font-size: var(--fs-xs); font-weight: 600; cursor: pointer; }
    .charge-modal__payment-btn--active { border-color: var(--color-primary); background: var(--color-primary); color: var(--color-text-inverse); }

    .charge-modal__splits { margin-bottom: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
    .charge-modal__split-row { display: grid; grid-template-columns: 1.2fr 1fr auto; gap: var(--space-2); align-items: center; }
    .charge-modal__split-row select, .charge-modal__split-row input { border: 1.5px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-2); font-size: var(--fs-sm); background: var(--color-surface); }
    .charge-modal__split-remove { border: none; background: transparent; color: var(--color-danger); cursor: pointer; font-size: 1rem; }
    .charge-modal__split-add { border: 1.5px dashed var(--color-border); background: transparent; border-radius: var(--radius-md); padding: var(--space-2); font-size: var(--fs-xs); font-weight: 600; color: var(--color-text-muted); cursor: pointer; }
    .charge-modal__split-balance { display: flex; justify-content: space-between; font-size: var(--fs-xs); font-weight: 600; color: var(--color-success); padding: var(--space-1) 0; }
    .charge-modal__split-balance--error { color: var(--color-danger); }
  `],
})
export class ActiveOrdersPage implements OnInit {
  orders = signal<Order[]>([]);
  loading = signal(true);
  chargingId = signal<string | null>(null);
  chargingOrder = signal<Order | null>(null);
  lastChargedOrder = signal<Order | null>(null);

  customerPhone = '';
  splitMode = false;
  singleMethod: PaymentMethod = 'cash';
  splitRows: PaymentSplit[] = [{ method: 'cash', amount: 0 }];

  paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'cash', label: 'Efectivo', icon: '💵' },
    { value: 'card', label: 'Tarjeta', icon: '💳' },
    { value: 'transfer', label: 'Transferencia', icon: '📲' },
  ];

  constructor(
    private orderService: OrderService,
    private loyaltyService: LoyaltyService,
    private settings: SettingsService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      this.orders.set(await this.orderService.getOpenOrders());
    } finally {
      this.loading.set(false);
    }
  }

  openCharge(order: Order) {
    this.chargingOrder.set(order);
    this.customerPhone = '';
    this.splitMode = false;
    this.singleMethod = 'cash';
    this.splitRows = [{ method: 'cash', amount: order.total }];
  }

  setSplitMode(value: boolean) {
    this.splitMode = value;
    const order = this.chargingOrder();
    if (value && order && this.splitRows.length === 1) {
      this.splitRows = [{ method: 'cash', amount: order.total }];
    }
  }

  addSplitRow() {
    const order = this.chargingOrder();
    if (!order) return;
    const remaining = Math.max(0, order.total - this.splitSum());
    this.splitRows.push({ method: 'card', amount: remaining });
  }

  removeSplitRow(index: number) {
    this.splitRows.splice(index, 1);
  }

  splitSum(): number {
    return this.splitRows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }

  splitBalanced(): boolean {
    const order = this.chargingOrder();
    if (!order) return false;
    return Math.abs(this.splitSum() - order.total) < 0.01 && this.splitRows.every((r) => r.amount > 0);
  }

  async confirmCharge() {
    const order = this.chargingOrder();
    if (!order?.id) return;
    if (this.splitMode && !this.splitBalanced()) return;

    this.chargingId.set(order.id);
    try {
      const payments: PaymentSplit[] = this.splitMode
        ? this.splitRows.map((r) => ({ method: r.method, amount: Number(r.amount) }))
        : [{ method: this.singleMethod, amount: order.total }];

      await this.orderService.markOrderPaid(order, payments, this.customerPhone.trim() || undefined);

      if (this.customerPhone.trim()) {
        await this.loyaltyService.addPoints(this.customerPhone.trim(), order.total, this.settings.loyaltyRate());
      }

      this.lastChargedOrder.set({
        ...order,
        payments,
        payment_method: payments.length > 1 ? 'mixed' : payments[0].method,
        status: 'paid',
      });
      this.chargingOrder.set(null);
      await this.load();
    } finally {
      this.chargingId.set(null);
    }
  }

  async cancel(order: Order) {
    if (!order.id || !confirm(`¿Cancelar la orden #${order.order_number}?`)) return;
    await this.orderService.cancelOrder(order.id);
    await this.load();
  }
}
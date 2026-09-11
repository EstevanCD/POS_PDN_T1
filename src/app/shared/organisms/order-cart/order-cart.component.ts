import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderItem, PaymentMethod, PaymentSplit } from '../../../core/models/order.model';
import { Discount, calculateDiscountAmount } from '../../../core/utils/discount.util';
import { QuantitySelectorComponent } from '../../molecules/quantity-selector/quantity-selector.component';
import { DiscountEditorComponent } from '../../molecules/discount-editor/discount-editor.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';

@Component({
  selector: 'app-order-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, QuantitySelectorComponent, DiscountEditorComponent, ButtonComponent, AppCurrencyPipe],
  template: `
    <div class="cart">
      <div class="cart__header">
        <h3>🧾 Orden actual</h3>
        <span class="cart__count">{{ items.length }} productos</span>
      </div>

      <div class="cart__list">
        <div class="cart__item" *ngFor="let item of items">
          <div class="cart__item-main">
            <div class="cart__item-info">
              <p class="cart__item-name">{{ item.product_name }}</p>
              <p class="cart__item-price">{{ item.unit_price | appCurrency }}</p>
              <p class="cart__item-note" *ngIf="item.notes">📝 {{ item.notes }}</p>
            </div>
            <app-quantity-selector
              [value]="item.quantity"
              (valueChange)="quantityChange.emit({ item, quantity: $event })"
            ></app-quantity-selector>
            <button
              class="cart__note-btn"
              [class.cart__note-btn--active]="!!item.notes"
              (click)="toggleNotes(item)"
              aria-label="Agregar nota"
              title="Nota para este producto"
            >
              📝
            </button>
            <button class="cart__remove" (click)="remove.emit(item)" aria-label="Quitar">✕</button>
          </div>
          <div class="cart__note-input" *ngIf="notesOpenFor === item.product_id">
            <input
              type="text"
              [ngModel]="item.notes"
              (ngModelChange)="onNotesInput(item, $event)"
              [name]="'notes-' + item.product_id"
              placeholder="Ej. sin cebolla, extra queso..."
            />
          </div>
        </div>
        <p class="cart__empty" *ngIf="!items.length">Toca un producto del menú para agregarlo aquí.</p>
      </div>

      <div class="cart__footer" *ngIf="items.length">
        <div class="cart__row" *ngIf="hasDiscount()">
          <span>Subtotal</span>
          <span>{{ total | appCurrency }}</span>
        </div>
        <div class="cart__row cart__row--discount" *ngIf="hasDiscount()">
          <span>Descuento<span *ngIf="discount && discount.reason"> ({{ discount.reason }})</span></span>
          <span>-{{ discountAmount() | appCurrency }}</span>
        </div>
        <div class="cart__row cart__row--total">
          <span>Total</span>
          <span>{{ finalTotal() | appCurrency }}</span>
        </div>

        <app-discount-editor [subtotal]="total" [discount]="discount" (discountChange)="onDiscountChange($event)"></app-discount-editor>

        <div class="cart__table">
          <label>📍 Mesa / Entrega</label>
          <select [(ngModel)]="tableNumber" name="tableNumber">
            <option value="Para llevar">🛍️ Para llevar</option>
            <option *ngFor="let n of tableOptions" [value]="'Mesa ' + n">Mesa {{ n }}</option>
          </select>
        </div>

        <div class="cart__loyalty">
          <label>📱 Teléfono del cliente (opcional, para acumular puntos)</label>
          <input type="text" [(ngModel)]="customerPhone" name="customerPhone" placeholder="Ej. 3001234567" />
        </div>

        <div class="cart__split-toggle">
          <button
            class="cart__split-btn"
            [class.cart__split-btn--active]="!splitMode"
            (click)="setSplitMode(false)"
          >
            Un solo método
          </button>
          <button
            class="cart__split-btn"
            [class.cart__split-btn--active]="splitMode"
            (click)="setSplitMode(true)"
          >
            Varios métodos
          </button>
        </div>

        <!-- Modo simple: un solo método de pago -->
        <div class="cart__payment" *ngIf="!splitMode">
          <button
            *ngFor="let m of paymentMethods"
            class="cart__payment-btn"
            [class.cart__payment-btn--active]="singleMethod === m.value"
            (click)="singleMethod = m.value"
          >
            {{ m.icon }} {{ m.label }}
          </button>
        </div>

        <!-- Modo dividido: varias filas de método + monto -->
        <div class="cart__splits" *ngIf="splitMode">
          <div class="cart__split-row" *ngFor="let row of splitRows; let i = index">
            <select [(ngModel)]="row.method" [name]="'splitMethod' + i">
              <option *ngFor="let m of paymentMethods" [value]="m.value">{{ m.icon }} {{ m.label }}</option>
            </select>
            <input type="number" min="0" step="0.01" [(ngModel)]="row.amount" [name]="'splitAmount' + i" placeholder="Monto" />
            <button class="cart__split-remove" (click)="removeSplitRow(i)" aria-label="Quitar método" *ngIf="splitRows.length > 1">✕</button>
          </div>
          <button class="cart__split-add" (click)="addSplitRow()">➕ Agregar otro método</button>

          <div class="cart__split-balance" [class.cart__split-balance--error]="!splitBalanced()">
            <span>Asignado: {{ splitSum() | appCurrency }}</span>
            <span>Falta: {{ (finalTotal() - splitSum()) | appCurrency }}</span>
          </div>
        </div>

        <app-button
          [full]="true"
          size="lg"
          [loading]="submitting"
          [disabled]="splitMode && !splitBalanced()"
          (clicked)="onCheckout()"
        >
          Cobrar {{ finalTotal() | appCurrency }}
        </app-button>
        <app-button variant="outline" [full]="true" [loading]="sendingOrder" (clicked)="onSendOrder()">
          🧾 Enviar orden (sin cobrar)
        </app-button>
      </div>
    </div>
  `,
  styleUrl: './order-cart.component.scss',
})
export class OrderCartComponent implements OnChanges {
  @Input() items: OrderItem[] = [];
  @Input() total = 0;
  @Input() submitting = false;
  @Input() sendingOrder = false;
  @Output() quantityChange = new EventEmitter<{ item: OrderItem; quantity: number }>();
  @Output() remove = new EventEmitter<OrderItem>();
  @Output() notesChange = new EventEmitter<{ item: OrderItem; notes: string }>();
  @Output() checkout = new EventEmitter<{ payments: PaymentSplit[]; phone: string; table: string; discount: Discount | null }>();
  @Output() sendOrder = new EventEmitter<{ table: string; discount: Discount | null }>();

  paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'cash', label: 'Efectivo', icon: '💵' },
    { value: 'card', label: 'Tarjeta', icon: '💳' },
    { value: 'transfer', label: 'Transf.', icon: '📲' },
  ];

  customerPhone = '';
  tableNumber = 'Para llevar';
  tableOptions = Array.from({ length: 10 }, (_, i) => i + 1);
  splitMode = false;
  singleMethod: PaymentMethod = 'cash';
  splitRows: PaymentSplit[] = [{ method: 'cash', amount: 0 }];
  discount: Discount | null = null;
  notesOpenFor: string | null = null;

  ngOnChanges() {
    if (!this.splitMode && this.splitRows.length === 1) {
      this.splitRows[0].amount = this.finalTotal();
    }
  }

  hasDiscount(): boolean {
    return !!this.discount && this.discount.value > 0;
  }

  discountAmount(): number {
    return calculateDiscountAmount(this.total, this.discount);
  }

  finalTotal(): number {
    return Math.max(0, this.total - this.discountAmount());
  }

  onDiscountChange(discount: Discount | null) {
    this.discount = discount;
    if (!this.splitMode) {
      this.splitRows[0].amount = this.finalTotal();
    }
  }

  toggleNotes(item: OrderItem) {
    this.notesOpenFor = this.notesOpenFor === item.product_id ? null : item.product_id;
  }

  onNotesInput(item: OrderItem, notes: string) {
    this.notesChange.emit({ item, notes });
  }

  setSplitMode(value: boolean) {
    this.splitMode = value;
    if (value && this.splitRows.length === 1) {
      this.splitRows = [{ method: 'cash', amount: this.finalTotal() }];
    }
  }

  addSplitRow() {
    const assigned = this.splitSum();
    const remaining = Math.max(0, this.finalTotal() - assigned);
    this.splitRows.push({ method: 'card', amount: remaining });
  }

  removeSplitRow(index: number) {
    this.splitRows.splice(index, 1);
  }

  splitSum(): number {
    return this.splitRows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }

  splitBalanced(): boolean {
    return Math.abs(this.splitSum() - this.finalTotal()) < 0.01 && this.splitRows.every((r) => r.amount > 0);
  }

  onCheckout() {
    const payments: PaymentSplit[] = this.splitMode
      ? this.splitRows.map((r) => ({ method: r.method, amount: Number(r.amount) }))
      : [{ method: this.singleMethod, amount: this.finalTotal() }];

    this.checkout.emit({ payments, phone: this.customerPhone.trim(), table: this.tableNumber, discount: this.discount });
  }

  onSendOrder() {
    this.sendOrder.emit({ table: this.tableNumber, discount: this.discount });
  }
}
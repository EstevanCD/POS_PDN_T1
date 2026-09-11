import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Order } from '../../../core/models/order.model';
import { SettingsService } from '../../../core/services/settings.service';
import { ButtonComponent } from '../../atoms/button/button.component';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';
import { LabelPipe } from '../../pipes/label.pipe';
import { buildTicketText, buildTicketHtml, printTicket, whatsappShareUrl, emailShareUrl } from '../../../core/utils/ticket.util';

@Component({
  selector: 'app-ticket-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, AppCurrencyPipe, LabelPipe],
  template: `
    <div class="ticket-modal__backdrop" (click)="close.emit()">
      <div class="ticket-modal" (click)="$event.stopPropagation()">
        <h3>✅ Orden cobrada</h3>
        <div class="ticket-modal__receipt">
          <p class="ticket-modal__cafe">{{ settings.cafeName() }}</p>
          <p class="ticket-modal__meta">Orden #{{ order.order_number }}</p>
          <div class="ticket-modal__items">
            <div class="ticket-modal__item-block" *ngFor="let it of order.items">
              <div class="ticket-modal__row">
                <span>{{ it.quantity }}x {{ it.product_name }}</span>
                <span>{{ it.subtotal | appCurrency }}</span>
              </div>
              <p class="ticket-modal__note" *ngIf="it.notes">📝 {{ it.notes }}</p>
            </div>
          </div>
          <div class="ticket-modal__row" *ngIf="order.discount_type && order.discount_value">
            <span>Subtotal</span>
            <span>{{ order.subtotal ?? order.total | appCurrency }}</span>
          </div>
          <div class="ticket-modal__row ticket-modal__row--discount" *ngIf="order.discount_type && order.discount_value">
            <span>Descuento</span>
            <span>-{{ (order.subtotal ?? order.total) - order.total | appCurrency }}</span>
          </div>
          <div class="ticket-modal__row ticket-modal__row--total">
            <span>Total</span>
            <span>{{ order.total | appCurrency }}</span>
          </div>
          <div class="ticket-modal__payments" *ngIf="order.payments && order.payments.length > 1">
            <div class="ticket-modal__row" *ngFor="let p of order.payments">
              <span>{{ p.method | appLabel: 'payment' }}</span>
              <span>{{ p.amount | appCurrency }}</span>
            </div>
          </div>
        </div>

        <div class="ticket-modal__field">
          <label>Teléfono WhatsApp del cliente (opcional, con código de país)</label>
          <input type="text" [(ngModel)]="phone" name="phone" placeholder="57300..." />
        </div>

        <div class="ticket-modal__actions">
          <app-button variant="outline" [full]="true" (clicked)="print()">🖨️ Imprimir</app-button>
          <a [href]="whatsappUrl()" target="_blank" class="ticket-modal__link">
            <app-button variant="outline" [full]="true">📲 WhatsApp</app-button>
          </a>
        </div>

        <app-button [full]="true" (clicked)="close.emit()">Cerrar</app-button>
      </div>
    </div>
  `,
  styles: [`
    .ticket-modal__backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: var(--space-4); }
    .ticket-modal { background: var(--color-surface); border-radius: var(--radius-lg); padding: var(--space-5); max-width: 380px; width: 100%; max-height: 90vh; overflow-y: auto; }
    .ticket-modal h3 { margin-bottom: var(--space-3); text-align: center; }
    .ticket-modal__receipt { background: var(--color-surface-alt); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-3); font-family: monospace; font-size: var(--fs-sm); }
    .ticket-modal__cafe { text-align: center; font-weight: 700; margin-bottom: 4px; }
    .ticket-modal__meta { text-align: center; color: var(--color-text-muted); font-size: var(--fs-xs); margin-bottom: var(--space-2); }
    .ticket-modal__row { display: flex; justify-content: space-between; padding: 2px 0; }
    .ticket-modal__row--total { font-weight: 700; border-top: 1px dashed var(--color-border); margin-top: var(--space-2); padding-top: var(--space-2); }
    .ticket-modal__row--discount { color: var(--color-success); font-weight: 600; }
    .ticket-modal__note { font-size: var(--fs-xs); color: var(--color-warning); font-style: italic; margin: 0 0 4px; }
    .ticket-modal__field { margin-bottom: var(--space-3); display: flex; flex-direction: column; gap: 4px; }
    .ticket-modal__field label { font-size: var(--fs-xs); color: var(--color-text-muted); font-weight: 600; }
    .ticket-modal__field input { border: 1.5px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-2); font-size: var(--fs-sm); }
    .ticket-modal__actions { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-3); }
    .ticket-modal__link { text-decoration: none; display: block; }
    .ticket-modal__payments { margin-top: var(--space-2); border-top: 1px dashed var(--color-border); padding-top: var(--space-2); }
  `],
})
export class TicketModalComponent {
  @Input({ required: true }) order!: Order;
  @Output() close = new EventEmitter<void>();

  phone = '';

  constructor(public settings: SettingsService) { }

  print() {
    printTicket(buildTicketHtml(this.order, this.settings.cafeName(), this.fmt));
  }

  whatsappUrl(): string {
    return whatsappShareUrl(buildTicketText(this.order, this.settings.cafeName(), this.fmt), this.phone || undefined);
  }

  private fmt = (n: number): string => {
    const currency = this.settings.currency();
    const locale = currency === 'COP' ? 'es-CO' : currency === 'EUR' ? 'es-ES' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'COP' ? 0 : 2,
      maximumFractionDigits: currency === 'COP' ? 0 : 2,
    }).format(n);
  };
}
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Discount, DiscountType, calculateDiscountAmount } from '../../../core/utils/discount.util';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';

@Component({
  selector: 'app-discount-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, AppCurrencyPipe],
  template: `
    <div class="discount-editor">
      <button
        *ngIf="!open && !hasDiscount()"
        type="button"
        class="discount-editor__toggle"
        (click)="open = true"
      >
        🏷️ Agregar descuento
      </button>

      <div class="discount-editor__summary" *ngIf="!open && hasDiscount()">
        <span>🏷️ Descuento: -{{ discountAmount() | appCurrency }}<span *ngIf="reason"> ({{ reason }})</span></span>
        <button type="button" class="discount-editor__edit" (click)="open = true">Editar</button>
        <button type="button" class="discount-editor__remove" (click)="removeDiscount()">Quitar</button>
      </div>

      <div class="discount-editor__panel" *ngIf="open">
        <div class="discount-editor__type-toggle">
          <button
            type="button"
            class="discount-editor__type-btn"
            [class.discount-editor__type-btn--active]="type === 'percentage'"
            (click)="setType('percentage')"
          >
            % Porcentaje
          </button>
          <button
            type="button"
            class="discount-editor__type-btn"
            [class.discount-editor__type-btn--active]="type === 'fixed'"
            (click)="setType('fixed')"
          >
            $ Valor fijo
          </button>
        </div>

        <div class="discount-editor__fields">
          <input
            type="number"
            min="0"
            [step]="type === 'percentage' ? 1 : 100"
            [(ngModel)]="value"
            name="discountValue"
            [placeholder]="type === 'percentage' ? 'Ej. 10' : 'Ej. 5000'"
            (ngModelChange)="emitChange()"
          />
          <input
            type="text"
            [(ngModel)]="reason"
            name="discountReason"
            placeholder="Motivo (opcional): cliente frecuente..."
            (ngModelChange)="emitChange()"
          />
        </div>

        <div class="discount-editor__preview" *ngIf="value && value > 0">
          <span>Descuento: -{{ discountAmount() | appCurrency }}</span>
          <span>Nuevo total: {{ (subtotal - discountAmount()) | appCurrency }}</span>
        </div>

        <div class="discount-editor__actions">
          <button type="button" class="discount-editor__done" (click)="close()">Listo</button>
          <button type="button" class="discount-editor__cancel" *ngIf="hasDiscount()" (click)="removeDiscount()">Quitar descuento</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .discount-editor { margin-bottom: var(--space-3); }
    .discount-editor__toggle {
      border: 1.5px dashed var(--color-border);
      background: transparent;
      border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-3);
      font-size: var(--fs-sm);
      font-weight: 600;
      color: var(--color-text-muted);
      cursor: pointer;
      width: 100%;
      text-align: left;
    }
    .discount-editor__toggle:hover { background: var(--color-surface-alt); }

    .discount-editor__summary {
      display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;
      background: var(--color-surface-alt); border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-3); font-size: var(--fs-sm); font-weight: 600;
      color: var(--color-success);
    }
    .discount-editor__summary span:first-child { flex: 1; min-width: 0; }
    .discount-editor__edit, .discount-editor__remove {
      border: none; background: transparent; font-size: var(--fs-xs); font-weight: 700;
      cursor: pointer; text-decoration: underline; color: var(--color-text-muted);
    }
    .discount-editor__remove { color: var(--color-danger); }

    .discount-editor__panel {
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      background: var(--color-surface-alt);
    }
    .discount-editor__type-toggle { display: flex; gap: var(--space-2); margin-bottom: var(--space-2); }
    .discount-editor__type-btn {
      flex: 1; padding: var(--space-2); border-radius: var(--radius-md);
      border: 1.5px solid var(--color-border); background: var(--color-surface);
      font-size: var(--fs-xs); font-weight: 600; cursor: pointer;
    }
    .discount-editor__type-btn--active { border-color: var(--color-primary); background: var(--color-primary); color: var(--color-text-inverse); }

    .discount-editor__fields { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-2); }
    .discount-editor__fields input {
      border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-2); font-size: var(--fs-sm); background: var(--color-surface);
      width: 100%; box-sizing: border-box;
    }

    .discount-editor__preview {
      display: flex; justify-content: space-between; font-size: var(--fs-xs);
      font-weight: 700; color: var(--color-success); margin-bottom: var(--space-2);
    }

    .discount-editor__actions { display: flex; gap: var(--space-2); }
    .discount-editor__done {
      flex: 1; border: none; border-radius: var(--radius-md); background: var(--color-primary);
      color: var(--color-text-inverse); padding: var(--space-2); font-weight: 700; font-size: var(--fs-sm); cursor: pointer;
    }
    .discount-editor__cancel {
      border: none; background: transparent; color: var(--color-danger);
      font-size: var(--fs-xs); font-weight: 600; cursor: pointer;
    }
  `],
})
export class DiscountEditorComponent implements OnChanges {
  @Input() subtotal = 0;
  @Input() discount: Discount | null = null;
  @Output() discountChange = new EventEmitter<Discount | null>();

  open = false;
  type: DiscountType = 'percentage';
  value: number | null = null;
  reason = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['discount'] && this.discount) {
      this.type = this.discount.type;
      this.value = this.discount.value;
      this.reason = this.discount.reason;
    }
  }

  hasDiscount(): boolean {
    return !!this.value && this.value > 0;
  }

  discountAmount(): number {
    return calculateDiscountAmount(this.subtotal, this.hasDiscount() ? { type: this.type, value: this.value!, reason: this.reason } : null);
  }

  setType(type: DiscountType) {
    this.type = type;
    this.emitChange();
  }

  emitChange() {
    if (this.hasDiscount()) {
      this.discountChange.emit({ type: this.type, value: this.value!, reason: this.reason });
    } else {
      this.discountChange.emit(null);
    }
  }

  close() {
    this.open = false;
  }

  removeDiscount() {
    this.value = null;
    this.reason = '';
    this.open = false;
    this.discountChange.emit(null);
  }
}
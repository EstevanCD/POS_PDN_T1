import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-quantity-selector',
  standalone: true,
  template: `
    <div class="qty">
      <button class="qty__btn" (click)="decrement()" aria-label="Disminuir">−</button>
      <span class="qty__value">{{ value }}</span>
      <button class="qty__btn" (click)="increment()" aria-label="Aumentar">+</button>
    </div>
  `,
  styles: [`
    .qty {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      background: var(--color-surface-alt);
      border-radius: var(--radius-full);
      padding: 2px;
    }
    .qty__btn {
      width: 28px; height: 28px;
      border: none; border-radius: 50%;
      background: var(--color-surface);
      color: var(--color-primary);
      font-size: 1.1rem; font-weight: 700;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      display: flex; align-items: center; justify-content: center;
    }
    .qty__btn:active { transform: scale(0.9); }
    .qty__value { min-width: 20px; text-align: center; font-weight: 700; }
  `],
})
export class QuantitySelectorComponent {
  @Input() value = 1;
  @Input() min = 1;
  @Input() max = 999;
  @Output() valueChange = new EventEmitter<number>();

  increment() {
    if (this.value < this.max) this.valueChange.emit(this.value + 1);
  }
  decrement() {
    if (this.value > this.min) this.valueChange.emit(this.value - 1);
  }
}

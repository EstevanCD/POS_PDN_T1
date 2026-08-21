import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="btn"
      [class]="'btn--' + variant + ' btn--' + size"
      [class.btn--full]="full"
      [type]="type"
      [disabled]="disabled || loading"
      (click)="clicked.emit($event)"
    >
      <span *ngIf="loading" class="btn__spinner"></span>
      <span *ngIf="icon && !loading" class="btn__icon">{{ icon }}</span>
      <span class="btn__label"><ng-content></ng-content></span>
    </button>
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() full = false;
  @Input() icon?: string;
  @Output() clicked = new EventEmitter<MouseEvent>();
}

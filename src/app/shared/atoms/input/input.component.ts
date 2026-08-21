import { Component, forwardRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <label class="field">
      <span class="field__label" *ngIf="label">{{ label }}</span>
      <div class="field__control">
        <span class="field__icon" *ngIf="icon">{{ icon }}</span>
        <input
          [type]="type"
          [placeholder]="placeholder"
          [(ngModel)]="value"
          (ngModelChange)="onChange($event)"
          (blur)="onTouched()"
          [step]="step"
          [min]="min"
          [disabled]="disabled"
        />
      </div>
    </label>
  `,
  styleUrl: './input.component.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputComponent), multi: true },
  ],
})
export class InputComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder = '';
  @Input() type: 'text' | 'number' | 'email' | 'password' | 'date' = 'text';
  @Input() icon?: string;
  @Input() step?: string;
  @Input() min?: string;
  @Input() disabled = false;

  value: any = '';
  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: any): void { this.value = value; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}

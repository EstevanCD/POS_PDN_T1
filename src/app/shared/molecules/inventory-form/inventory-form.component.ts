import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../atoms/button/button.component';
import { InventoryItem } from '../../../core/models/inventory.model';
import { UNIT_OPTIONS } from '../../../core/utils/unit-conversion';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  template: `
    <form class="inv-form" (ngSubmit)="submit()">
      <div class="inv-form__grid">
        <label class="inv-form__field">
          <span>Nombre del insumo</span>
          <input type="text" [(ngModel)]="name" name="name" placeholder="Ej. Leche entera" required />
        </label>
        <label class="inv-form__field">
          <span>Unidad</span>
          <select [(ngModel)]="unit" name="unit" required>
            <option value="" disabled>Selecciona...</option>
            <option *ngFor="let u of unitOptions" [value]="u.value">{{ u.label }}</option>
          </select>
        </label>
        <label class="inv-form__field">
          <span>Cantidad actual</span>
          <input type="number" step="0.01" min="0" [(ngModel)]="quantity" name="quantity" required />
        </label>
        <label class="inv-form__field">
          <span>Cantidad mínima</span>
          <input type="number" step="0.01" min="0" [(ngModel)]="minQuantity" name="minQuantity" required />
        </label>
        <label class="inv-form__field">
          <span>Costo unitario</span>
          <input type="number" step="0.01" min="0" [(ngModel)]="costPerUnit" name="costPerUnit" required />
        </label>
      </div>
      <app-button type="submit" [full]="true">{{ editingId ? '💾 Guardar cambios' : '➕ Agregar insumo' }}</app-button>
    </form>
  `,
  styles: [`
    .inv-form__grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }
    .inv-form__field {
      display: flex; flex-direction: column; gap: 4px;
      font-size: var(--fs-sm); font-weight: 600; color: var(--color-text-muted);
    }
    .inv-form__field input {
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      font-size: var(--fs-md);
      color: var(--color-text);
      background: var(--color-surface);
    }
    @media (max-width: 720px) {
      .inv-form__grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .inv-form__grid { grid-template-columns: 1fr; }
    }
  `],
})
export class InventoryFormComponent implements OnChanges {
  unitOptions = UNIT_OPTIONS;
  @Input() editingItem: InventoryItem | null = null;
  @Output() save = new EventEmitter<Partial<InventoryItem>>();

  name = '';
  unit = '';
  quantity: number | null = null;
  minQuantity: number | null = null;
  costPerUnit: number | null = null;
  editingId: string | null = null;

  ngOnChanges() {
    if (this.editingItem) {
      this.editingId = this.editingItem.id ?? null;
      this.name = this.editingItem.name;
      this.unit = this.editingItem.unit;
      this.quantity = this.editingItem.quantity;
      this.minQuantity = this.editingItem.min_quantity;
      this.costPerUnit = this.editingItem.cost_per_unit;
    }
  }

  submit() {
    if (!this.name || !this.unit || this.quantity === null || this.minQuantity === null || this.costPerUnit === null) return;
    this.save.emit({
      id: this.editingId ?? undefined,
      name: this.name,
      unit: this.unit,
      quantity: this.quantity,
      min_quantity: this.minQuantity,
      cost_per_unit: this.costPerUnit,
    });
    this.reset();
  }

  reset() {
    this.editingId = null;
    this.name = '';
    this.unit = '';
    this.quantity = null;
    this.minQuantity = null;
    this.costPerUnit = null;
  }
}

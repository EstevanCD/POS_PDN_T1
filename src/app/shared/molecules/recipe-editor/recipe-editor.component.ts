import { Component, Input, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecipeService } from '../../../core/services/recipe.service';
import { InventoryItem } from '../../../core/models/inventory.model';
import { RecipeEntry } from '../../../core/models/recipe.model';
import { ButtonComponent } from '../../atoms/button/button.component';
import { SpinnerComponent } from '../../atoms/spinner/spinner.component';
import { UNIT_OPTIONS } from '../../../core/utils/unit-conversion';

@Component({
  selector: 'app-recipe-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, SpinnerComponent],
  template: `
    <div class="recipe-editor">
      <h4>🧪 Receta de "{{ productName }}"</h4>
      <p class="recipe-editor__hint">
        Define cuánto insumo consume una unidad de este producto. Puedes usar gramos o mililitros
        aunque el inventario esté en kg o litros: el sistema convierte automáticamente.
      </p>

      <div class="recipe-editor__loading" *ngIf="loading()"><app-spinner [size]="20"></app-spinner></div>

      <div class="recipe-editor__list" *ngIf="!loading()">
        <div class="recipe-editor__row" *ngFor="let entry of entries()">
          <span class="recipe-editor__item-name">
            {{ entry.inventory_item_name }}
            <span class="recipe-editor__storage-unit">(se guarda en {{ entry.inventory_item_unit }})</span>
          </span>
          <span class="recipe-editor__item-qty">{{ entry.quantity_used }} {{ entry.unit }}</span>
          <button class="recipe-editor__remove" (click)="remove(entry)" aria-label="Quitar">✕</button>
        </div>
        <p class="recipe-editor__empty" *ngIf="!entries().length">
          Este producto aún no tiene receta (no descontará inventario al venderse).
        </p>
      </div>

      <div class="recipe-editor__form">
        <select [(ngModel)]="selectedInventoryId" name="selectedInventoryId">
          <option value="" disabled selected>Insumo...</option>
          <option *ngFor="let item of availableItems()" [value]="item.id">{{ item.name }} ({{ item.unit }})</option>
        </select>
        <input type="number" step="0.001" min="0" [(ngModel)]="quantityUsed" name="quantityUsed" placeholder="Cantidad" />
        <select [(ngModel)]="selectedUnit" name="selectedUnit">
          <option *ngFor="let u of unitOptions" [value]="u.value">{{ u.label }}</option>
        </select>
        <app-button size="sm" (clicked)="add()">➕ Agregar</app-button>
      </div>
    </div>
  `,
  styles: [`
    .recipe-editor {
      border: 1.5px dashed var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      margin-top: var(--space-3);
      background: var(--color-surface-alt);
    }
    .recipe-editor h4 { margin-bottom: 4px; }
    .recipe-editor__hint { font-size: var(--fs-xs); color: var(--color-text-muted); margin-bottom: var(--space-3); }
    .recipe-editor__loading { display: flex; justify-content: center; padding: var(--space-3); }
    .recipe-editor__list { margin-bottom: var(--space-3); }
    .recipe-editor__row {
      display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: var(--space-2);
      padding: var(--space-2) 0; border-bottom: 1px dashed var(--color-border); font-size: var(--fs-sm);
    }
    .recipe-editor__item-name { min-width: 0; overflow-wrap: break-word; }
    .recipe-editor__storage-unit { color: var(--color-text-muted); font-size: var(--fs-xs); font-weight: 400; display: block; }
    .recipe-editor__item-qty { color: var(--color-text-muted); font-weight: 600; white-space: nowrap; }
    .recipe-editor__remove { border: none; background: transparent; color: var(--color-danger); cursor: pointer; flex-shrink: 0; }
    .recipe-editor__empty { color: var(--color-text-muted); font-size: var(--fs-sm); }
    .recipe-editor__form {
      display: grid;
      grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr) auto;
      gap: var(--space-2);
    }
    .recipe-editor__form select, .recipe-editor__form input {
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
      border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-2); font-size: var(--fs-sm); background: var(--color-surface);
    }
    .recipe-editor__form app-button { display: block; }

    @media (max-width: 640px) {
      .recipe-editor__form { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
    }
    @media (max-width: 420px) {
      .recipe-editor__form { grid-template-columns: minmax(0, 1fr); }
    }
  `],
})
export class RecipeEditorComponent implements OnChanges {
  @Input({ required: true }) productId!: string;
  @Input() productName = '';
  @Input() inventoryItems: InventoryItem[] = [];

  entries = signal<RecipeEntry[]>([]);
  loading = signal(true);
  selectedInventoryId = '';
  quantityUsed: number | null = null;
  selectedUnit = 'g';
  unitOptions = UNIT_OPTIONS;

  constructor(private recipeService: RecipeService) { }

  ngOnChanges() {
    if (this.productId) this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      this.entries.set(await this.recipeService.getRecipeForProduct(this.productId));
    } finally {
      this.loading.set(false);
    }
  }

  availableItems(): InventoryItem[] {
    const usedIds = new Set(this.entries().map((e) => e.inventory_item_id));
    return this.inventoryItems.filter((i) => !usedIds.has(i.id!));
  }

  async add() {
    if (!this.selectedInventoryId || !this.quantityUsed) return;
    await this.recipeService.addEntry({
      product_id: this.productId,
      inventory_item_id: this.selectedInventoryId,
      quantity_used: this.quantityUsed,
      unit: this.selectedUnit,
    });
    this.selectedInventoryId = '';
    this.quantityUsed = null;
    this.selectedUnit = 'g';
    await this.load();
  }

  async remove(entry: RecipeEntry) {
    if (!entry.id) return;
    await this.recipeService.deleteEntry(entry.id);
    await this.load();
  }
}
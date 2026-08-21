import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryItem } from '../../core/models/inventory.model';
import { InventoryService } from '../../core/services/inventory.service';
import { InventoryTableComponent } from '../../shared/organisms/inventory-table/inventory-table.component';
import { InventoryFormComponent } from '../../shared/molecules/inventory-form/inventory-form.component';
import { StatCardComponent } from '../../shared/molecules/stat-card/stat-card.component';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { SpinnerComponent } from '../../shared/atoms/spinner/spinner.component';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { AuthService } from '../../core/services/auth.service';
import { hasPermission } from '../../core/utils/permissions';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [
    CommonModule,
    InventoryTableComponent,
    InventoryFormComponent,
    StatCardComponent,
    CardComponent,
    SpinnerComponent,
    ButtonComponent,
    AppCurrencyPipe,
  ],
  template: `
    <div class="inventory-page container-page">
      <div class="inventory-page__header">
        <h2>📦 Inventario</h2>
        <app-button *ngIf="canEdit()" (clicked)="showForm.set(!showForm())">{{ showForm() ? 'Cerrar' : '➕ Agregar insumo' }}</app-button>
      </div>

      <div class="inventory-page__stats">
        <app-stat-card icon="💰" label="Valor total inventario" [value]="totalValue() | appCurrency" tone="primary"></app-stat-card>
        <app-stat-card icon="⚠️" label="Insumos con bajo stock" [value]="lowStockCount().toString()" tone="danger"></app-stat-card>
        <app-stat-card icon="📦" label="Insumos registrados" [value]="items().length.toString()" tone="info"></app-stat-card>
      </div>

      <app-card *ngIf="showForm()" class="inventory-page__form-card">
        <app-inventory-form [editingItem]="editingItem()" (save)="saveItem($event)"></app-inventory-form>
      </app-card>

      <div class="inventory-page__loading" *ngIf="loading()"><app-spinner></app-spinner></div>

      <app-inventory-table
        *ngIf="!loading()"
        [items]="items()"
        (edit)="startEdit($event)"
        (delete)="deleteItem($event)"
      ></app-inventory-table>
    </div>
  `,
  styles: [`
    .inventory-page__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); flex-wrap: wrap; gap: var(--space-3); }
    .inventory-page__stats {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3);
      margin-bottom: var(--space-5);
    }
    .inventory-page__form-card { margin-bottom: var(--space-4); }
    .inventory-page__loading { display: flex; justify-content: center; padding: var(--space-8); }

    @media (max-width: 720px) {
      .inventory-page__stats { grid-template-columns: 1fr; }
    }
  `],
})
export class InventoryPage implements OnInit {
  items = signal<InventoryItem[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingItem = signal<InventoryItem | null>(null);

  constructor(private inventoryService: InventoryService, private auth: AuthService) { }

  canEdit(): boolean {
    return hasPermission(this.auth.profile()?.role, 'inventory:edit');
  }

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      this.items.set(await this.inventoryService.getItems());
    } finally {
      this.loading.set(false);
    }
  }

  totalValue(): number {
    return this.items().reduce((acc, i) => acc + i.quantity * i.cost_per_unit, 0);
  }

  lowStockCount(): number {
    return this.items().filter((i) => i.quantity <= i.min_quantity).length;
  }

  startEdit(item: InventoryItem) {
    this.editingItem.set(item);
    this.showForm.set(true);
  }

  async saveItem(payload: Partial<InventoryItem>) {
    if (payload.id) {
      await this.inventoryService.updateItem(payload.id, payload);
    } else {
      await this.inventoryService.createItem(payload);
    }
    this.editingItem.set(null);
    this.showForm.set(false);
    await this.load();
  }

  async deleteItem(item: InventoryItem) {
    if (!item.id || !confirm(`¿Eliminar "${item.name}" del inventario?`)) return;
    await this.inventoryService.deleteItem(item.id);
    await this.load();
  }
}

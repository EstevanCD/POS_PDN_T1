import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryItem } from '../../../core/models/inventory.model';
import { BadgeComponent } from '../../atoms/badge/badge.component';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';
import { InventoryFormComponent } from '../../molecules/inventory-form/inventory-form.component';

@Component({
  selector: 'app-inventory-table',
  standalone: true,
  imports: [CommonModule, BadgeComponent, AppCurrencyPipe, InventoryFormComponent],
  template: `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Insumo</th>
            <th>Cantidad</th>
            <th>Mínimo</th>
            <th>Costo/u</th>
            <th>Valor total</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <ng-container *ngFor="let item of items">
            <tr>
              <td class="table__name">{{ item.name }} <span class="table__unit">({{ item.unit }})</span></td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.min_quantity }}</td>
              <td>{{ item.cost_per_unit | appCurrency }}</td>
              <td>{{ item.quantity * item.cost_per_unit | appCurrency }}</td>
              <td>
                <app-badge [tone]="item.quantity <= item.min_quantity ? 'danger' : 'success'">
                  {{ item.quantity <= item.min_quantity ? 'Bajo stock' : 'OK' }}
                </app-badge>
              </td>
              <td class="table__actions">
                <ng-container *ngIf="canEdit">
                  <button (click)="toggleEdit(item)" aria-label="Editar">✏️</button>
                  <button (click)="delete.emit(item)" aria-label="Eliminar">🗑️</button>
                </ng-container>
                <span *ngIf="!canEdit" class="table__readonly">—</span>
              </td>
            </tr>

            <!-- Fila expandida con el formulario, justo debajo del ítem que se está editando -->
            <tr *ngIf="editingId === item.id" class="table__edit-row">
              <td colspan="7">
                <div class="table__edit-panel">
                  <h4>✏️ Editar "{{ item.name }}"</h4>
                  <app-inventory-form [editingItem]="item" (save)="onSave($event)"></app-inventory-form>
                </div>
              </td>
            </tr>
          </ng-container>

          <tr *ngIf="!items.length">
            <td colspan="7" class="table__empty">Aún no hay insumos registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table__edit-row td { padding: 0; border-top: none; }
    .table__edit-panel {
      border: 1.5px dashed var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      margin: 0 var(--space-4) var(--space-3);
      background: var(--color-surface-alt);
    }
    .table__edit-panel h4 { margin-bottom: var(--space-3); }
  `],
  styleUrl: '../../shared-table.scss',
})
export class InventoryTableComponent {
  @Input() items: InventoryItem[] = [];
  @Input() canEdit = false;
  @Output() edit = new EventEmitter<InventoryItem>();
  @Output() delete = new EventEmitter<InventoryItem>();
  @Output() save = new EventEmitter<Partial<InventoryItem>>();

  editingId: string | null = null;

  toggleEdit(item: InventoryItem) {
    this.editingId = this.editingId === item.id ? null : (item.id ?? null);
    this.edit.emit(item);
  }

  onSave(payload: Partial<InventoryItem>) {
    this.editingId = null;
    this.save.emit(payload);
  }
}
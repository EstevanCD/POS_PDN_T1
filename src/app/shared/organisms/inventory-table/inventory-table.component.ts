import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryItem } from '../../../core/models/inventory.model';
import { BadgeComponent } from '../../atoms/badge/badge.component';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';

@Component({
  selector: 'app-inventory-table',
  standalone: true,
  imports: [CommonModule, BadgeComponent, AppCurrencyPipe],
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
          <tr *ngFor="let item of items">
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
              <button (click)="edit.emit(item)" aria-label="Editar">✏️</button>
              <button (click)="delete.emit(item)" aria-label="Eliminar">🗑️</button>
            </td>
          </tr>
          <tr *ngIf="!items.length">
            <td colspan="7" class="table__empty">Aún no hay insumos registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styleUrl: '../../shared-table.scss',
})
export class InventoryTableComponent {
  @Input() items: InventoryItem[] = [];
  @Output() edit = new EventEmitter<InventoryItem>();
  @Output() delete = new EventEmitter<InventoryItem>();
}

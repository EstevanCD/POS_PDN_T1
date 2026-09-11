import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavItemComponent } from '../../molecules/nav-item/nav-item.component';
import { AuthService } from '../../../core/services/auth.service';
import { hasPermission, Permission } from '../../../core/utils/permissions';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, NavItemComponent],
  template: `
    <aside class="sidebar" [class.sidebar--open]="open">
      <nav class="sidebar__nav">
        <app-nav-item *ngIf="can('order:create')" route="/order" icon="🧾" label="Tomar orden"></app-nav-item>
        <app-nav-item route="/active-orders" icon="🕐" label="Órdenes activas"></app-nav-item>
        <app-nav-item *ngIf="can('menu:view')" route="/menu" icon="📋" label="Menú"></app-nav-item>
        <app-nav-item *ngIf="can('inventory:view')" route="/inventory" icon="📦" label="Inventario"></app-nav-item>
        <app-nav-item *ngIf="can('recipes:view')" route="/recipes" icon="🧪" label="Recetas"></app-nav-item>
        <app-nav-item *ngIf="can('finance:view')" route="/finance" icon="💰" label="Finanzas"></app-nav-item>
        <app-nav-item *ngIf="can('summary:view')" route="/daily-summary" icon="📅" label="Resumen diario"></app-nav-item>
        <app-nav-item *ngIf="can('summary:view')" route="/summary" icon="📈" label="Resumen mensual"></app-nav-item>
        <app-nav-item *ngIf="can('customers:view')" route="/customers" icon="🎁" label="Clientes"></app-nav-item>
        <app-nav-item *ngIf="can('settings:view')" route="/settings" icon="⚙️" label="Configuración"></app-nav-item>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      padding: var(--space-4) var(--space-3);
      flex-shrink: 0;
    }
    .sidebar__nav { display: flex; flex-direction: column; gap: var(--space-1); }

    @media (max-width: 1024px) {
      .sidebar {
        position: fixed;
        top: var(--header-height);
        left: 0;
        bottom: 0;
        width: min(280px, 80vw);
        transform: translateX(-100%);
        transition: transform 0.2s ease;
        z-index: 30;
        box-shadow: var(--shadow-lg);
        overflow-y: auto;
      }
      .sidebar--open { transform: translateX(0); }
    }
  `],
})
export class SidebarComponent {
  @Input() open = false;

  constructor(public auth: AuthService) { }

  can(permission: Permission): boolean {
    return hasPermission(this.auth.profile()?.role, permission);
  }
}
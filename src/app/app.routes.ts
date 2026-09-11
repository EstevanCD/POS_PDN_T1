import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/templates/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'order', pathMatch: 'full' },
      {
        path: 'order',
        loadComponent: () => import('./pages/order/order.page').then((m) => m.OrderPage),
        canActivate: [permissionGuard('order:create')],
        title: 'Tomar orden',
      },
      {
        path: 'active-orders',
        loadComponent: () => import('./pages/active-orders/active-orders.page').then((m) => m.ActiveOrdersPage),
        canActivate: [permissionGuard('order:view-active')],
        title: 'Órdenes activas',
      },
      {
        path: 'menu',
        loadComponent: () => import('./pages/menu/menu.page').then((m) => m.MenuPage),
        canActivate: [permissionGuard('menu:view')],
        title: 'Menú',
      },
            {
        path: 'recipes',
        loadComponent: () => import('./pages/recipes/recipes.page').then((m) => m.RecipesPage),
        canActivate: [permissionGuard('recipes:view')],
        title: 'Recetas',
      },
      {
        path: 'inventory',
        loadComponent: () => import('./pages/inventory/inventory.page').then((m) => m.InventoryPage),
        canActivate: [permissionGuard('inventory:view')],
        title: 'Inventario',
      },
      {
        path: 'finance',
        loadComponent: () => import('./pages/finance/finance.page').then((m) => m.FinancePage),
        canActivate: [permissionGuard('finance:view')],
        title: 'Finanzas',
      },
      {
        path: 'summary',
        loadComponent: () => import('./pages/summary/summary.page').then((m) => m.SummaryPage),
        canActivate: [permissionGuard('summary:view')],
        title: 'Resumen mensual',
      },
      {
        path: 'daily-summary',
        loadComponent: () => import('./pages/daily-summary/daily-summary.page').then((m) => m.DailySummaryPage),
        canActivate: [permissionGuard('summary:view')],
        title: 'Resumen diario',
      },
      {
        path: 'customers',
        loadComponent: () => import('./pages/customers/customers.page').then((m) => m.CustomersPage),
        canActivate: [permissionGuard('customers:view')],
        title: 'Clientes',
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage),
        canActivate: [adminGuard],
        title: 'Configuración',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
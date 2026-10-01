import { UserRole } from '../models/profile.model';

export type Permission =
  | 'order:create'
  | 'order:view-active'
  | 'order:manage'
  | 'order:mark-ready'
  | 'menu:view'
  | 'menu:edit'
  | 'inventory:view'
  | 'inventory:edit'
  | 'recipes:view'
  | 'finance:view'
  | 'finance:edit'
  | 'summary:view'
  | 'settings:view'
  | 'customers:view'
  | 'users:manage'
  | 'feria:order'
  | 'feria:sales';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'order:create', 'order:view-active', 'order:manage', 'order:mark-ready',
    'menu:view', 'menu:edit', 'inventory:view', 'inventory:edit', 'recipes:view',
    'finance:view', 'finance:edit', 'summary:view', 'settings:view',
    'customers:view', 'users:manage',
    'feria:order', 'feria:sales',
  ],
  cajero: [
    'order:create', 'order:view-active', 'order:manage', 'menu:view',
    'inventory:view', 'finance:view', 'finance:edit',
    'summary:view', 'customers:view',
  ],
  barista: [
    'order:create', 'order:view-active', 'order:manage', 'order:mark-ready',
    'menu:view', 'recipes:view',
  ],
  mesero: [
    'order:create', 'order:view-active', 'order:manage',
  ],
  cocinero: [
    'order:view-active', 'order:mark-ready', 'recipes:view',
  ],
  cafeferias: [
    'feria:order', 'feria:sales',
  ],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Devuelve la primera ruta a la que un rol SÍ tiene acceso. Se usa como
 * destino seguro cuando un guard rechaza una ruta, para nunca rebotar
 * a un rol (como cafeferias) hacia una página que tampoco puede ver.
 */
export function getDefaultRoute(role: UserRole | undefined): string {
  if (hasPermission(role, 'order:create')) return '/order';
  if (hasPermission(role, 'order:view-active')) return '/active-orders';
  if (hasPermission(role, 'feria:order')) return '/feria-order';
  if (hasPermission(role, 'feria:sales')) return '/feria-sales';
  return '/no-access';
}
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
  | 'users:manage';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'order:create', 'order:view-active', 'order:manage', 'order:mark-ready',
    'menu:view', 'menu:edit', 'inventory:view', 'inventory:edit', 'recipes:view',
    'finance:view', 'finance:edit', 'summary:view', 'settings:view',
    'customers:view', 'users:manage',
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
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
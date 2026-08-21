import { UserRole } from '../models/profile.model';

export type Permission =
  | 'order:create'
  | 'order:view-active'
  | 'menu:view'
  | 'menu:edit'
  | 'inventory:view'
  | 'inventory:edit'
  | 'finance:view'
  | 'finance:edit'
  | 'summary:view'
  | 'settings:view'
  | 'customers:view'
  | 'users:manage';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'order:create', 'order:view-active', 'menu:view', 'menu:edit',
    'inventory:view', 'inventory:edit', 'finance:view', 'finance:edit',
    'summary:view', 'settings:view', 'customers:view', 'users:manage',
  ],
  cajero: [
    'order:create', 'order:view-active', 'menu:view',
    'inventory:view', 'finance:view', 'finance:edit',
    'summary:view', 'customers:view',
  ],
  barista: [
    'order:create', 'order:view-active', 'menu:view',
    'inventory:view', 'inventory:edit',
  ],
  mesero: [
    'order:create', 'order:view-active',
  ],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
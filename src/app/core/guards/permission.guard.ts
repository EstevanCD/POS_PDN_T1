import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { hasPermission, getDefaultRoute, Permission } from '../utils/permissions';

export function permissionGuard(permission: Permission): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (hasPermission(auth.profile()?.role, permission)) return true;
    router.navigate([getDefaultRoute(auth.profile()?.role)]);
    return false;
  };
}
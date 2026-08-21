import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { hasPermission, Permission } from '../utils/permissions';

export function permissionGuard(permission: Permission): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (hasPermission(auth.profile()?.role, permission)) return true;
    router.navigate(['/order']);
    return false;
  };
}
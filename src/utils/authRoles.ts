import type { User } from '../types/auth';

const normalizeRole = (role: string) => role.trim().toUpperCase();

export const getUserRoleCodes = (user?: User | null): Set<string> => {
  const roles = new Set<string>();

  if (!user) {
    return roles;
  }

  if (Array.isArray(user.categories)) {
    user.categories.forEach((category) => {
      if (category?.categoryCode) {
        roles.add(normalizeRole(category.categoryCode));
      }
    });
  }

  if (!roles.size && user.cashierId !== undefined && user.cashierId !== null) {
    roles.add('CASHIER');
  }

  if (!roles.size) {
    roles.add('ADMIN');
  }

  return roles;
};

export const userHasRole = (user: User | null | undefined, role: string): boolean => {
  if (!role) {
    return false;
  }
  return getUserRoleCodes(user).has(normalizeRole(role));
};

export const getDefaultRelativePathForUser = (user?: User | null): string => {
  const roles = getUserRoleCodes(user);
  return roles.has('ADMIN') ? 'admin/dashboard' : 'cashier/dashboard';
};

export const buildTenantPath = (relativePath: string, tenantId?: string): string => {
  const sanitized = (relativePath ?? '').replace(/^\/+/, '');
  const prefix = tenantId ? `/posai/${tenantId}/` : '/';
  return `${prefix}${sanitized}`;
};

export const getDefaultTenantPath = (user?: User | null, tenantId?: string) => {
  return buildTenantPath(getDefaultRelativePathForUser(user), tenantId);
};

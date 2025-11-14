import type { User, UserAccess } from '../types/auth';

const normalizeRole = (role: string) => role.trim().toUpperCase();
const normalizeScreen = (code: string) => code.trim().toUpperCase();
const WILDCARD_SCREEN_CODES = ['ALL', '*', 'FULL_ACCESS'];

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
  if (!user) {
    return 'admin/dashboard';
  }

  if (userHasScreenAccess(user, 'CASHIER_DASHBOARD') || userHasScreenAccess(user, 'CASHIER_POS')) {
    return 'cashier/dashboard';
  }

  if (userHasScreenAccess(user, 'ADMIN_DASHBOARD')) {
    return 'admin/dashboard';
  }

  if (userHasScreenAccess(user, 'SHARED_CUSTOMERS')) {
    return 'admin/customers';
  }

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

export const getPosPortalLabel = (user?: User | null) => {
  const roles = getUserRoleCodes(user);
  if (roles.has('ADMIN')) {
    return 'POS Admin';
  }
  if (roles.has('MANAGER')) {
    return 'POS Manager';
  }
  if (roles.has('CASHIER')) {
    return 'POS Cashier';
  }
  return 'POS Admin';
};

const buildScreenAccessMap = (user?: User | null): Map<string, UserAccess> => {
  const map = new Map<string, UserAccess>();
  if (!user || !Array.isArray(user.access)) {
    return map;
  }
  user.access.forEach((access) => {
    if (access?.screenCode) {
      map.set(normalizeScreen(access.screenCode), access);
    }
  });
  return map;
};

const getWildcardAccess = (map: Map<string, UserAccess>): UserAccess | undefined => {
  for (const code of WILDCARD_SCREEN_CODES) {
    const wildcard = map.get(code);
    if (wildcard) {
      return wildcard;
    }
  }
  return undefined;
};

const hasPermission = (
  access: UserAccess,
  permission: 'view' | 'create' | 'edit' | 'delete',
): boolean => {
  switch (permission) {
    case 'create':
      return access.canCreate;
    case 'edit':
      return access.canEdit;
    case 'delete':
      return access.canDelete;
    default:
      return access.canView;
  }
};

export const userHasScreenAccess = (
  user: User | null | undefined,
  screenCode?: string,
  permission: 'view' | 'create' | 'edit' | 'delete' = 'view',
): boolean => {
  if (!screenCode) {
    return true;
  }
  const accessMap = buildScreenAccessMap(user);
  const access = accessMap.get(normalizeScreen(screenCode));
  if (access) {
    return hasPermission(access, permission);
  }
  const wildcardAccess = getWildcardAccess(accessMap);
  if (!wildcardAccess) {
    return false;
  }
  return hasPermission(wildcardAccess, permission);
};

export const userHasAnyScreenAccess = (user?: User | null): boolean => {
  if (!user || !Array.isArray(user.access) || !user.access.length) {
    return false;
  }

  return user.access.some((access) =>
    Boolean(access && (access.canView || access.canCreate || access.canEdit || access.canDelete)),
  );
};

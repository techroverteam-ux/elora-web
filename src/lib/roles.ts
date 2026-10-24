// Role helpers shared across the portal. Roles are admin-defined, so match on
// code OR name, case-insensitively ("Sub Admin" and "SUB_ADMIN" are the same).

const roleKeys = (role: any): string[] =>
  [role?.code, role?.name]
    .filter(Boolean)
    .map((v: any) => String(v).trim().toUpperCase().replace(/[\s-]+/g, "_"));

export const hasRole = (user: any, ...wanted: string[]): boolean =>
  Array.isArray(user?.roles) && user.roles.some((r: any) => roleKeys(r).some((k) => wanted.includes(k)));

export const isSuperAdmin = (user: any) => hasRole(user, "SUPER_ADMIN");

/** Sub Admin: Super Admin's rights, limited to the clients mapped to them. */
export const isSubAdmin = (user: any) => !isSuperAdmin(user) && hasRole(user, "SUB_ADMIN");

/** Anyone who gets the admin view: Super Admin, Admin, Sub Admin. */
export const isAdminRole = (user: any) => hasRole(user, "SUPER_ADMIN", "ADMIN", "SUB_ADMIN");

/** Super Admin and Sub Admin skip the per-module permission grid. */
export const hasAllPermissions = (user: any) => hasRole(user, "SUPER_ADMIN", "SUB_ADMIN");

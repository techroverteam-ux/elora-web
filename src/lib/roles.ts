// Role helpers shared across the portal. Roles are admin-defined, so match on
// code OR name, case-insensitively ("Sub Admin" and "SUB_ADMIN" are the same).

// Compare letters/digits only, so "SUB_ADMIN", "Sub Admin", "sub-admin" and
// "SubAdmin" all match.
const squash = (v: any) => String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

const roleKeys = (role: any): string[] =>
  [role?.code, role?.name].filter(Boolean).map(squash);

export const hasRole = (user: any, ...wanted: string[]): boolean =>
  Array.isArray(user?.roles) && user.roles.some((r: any) => roleKeys(r).some((k) => wanted.map(squash).includes(k)));

export const isSuperAdmin = (user: any) => hasRole(user, "SUPER_ADMIN");

/** Sub Admin: Super Admin's rights, limited to the clients mapped to them. */
export const isSubAdmin = (user: any) => !isSuperAdmin(user) && hasRole(user, "SUB_ADMIN");

/** Anyone who gets the admin view: Super Admin, Admin, Sub Admin. */
export const isAdminRole = (user: any) => hasRole(user, "SUPER_ADMIN", "ADMIN", "SUB_ADMIN");

/** Super Admin and Sub Admin skip the per-module permission grid. */
export const hasAllPermissions = (user: any) => hasRole(user, "SUPER_ADMIN", "SUB_ADMIN");

/** Modules a Sub Admin never gets: User Management, Role Management, Element Mapping. */
export const SUB_ADMIN_BLOCKED_MODULES = ["users", "roles", "elements"];

/** Page routes for those modules (used to keep Sub Admins out by URL). */
export const SUB_ADMIN_BLOCKED_PATHS = ["/users", "/roles", "/elements"];

export const isBlockedForSubAdmin = (user: any, moduleName: string) =>
  isSubAdmin(user) && SUB_ADMIN_BLOCKED_MODULES.includes(moduleName);

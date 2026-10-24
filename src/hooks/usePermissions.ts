import { useAuth } from "@/src/context/AuthContext";
import { hasAllPermissions } from "@/src/lib/roles";

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (resource: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
    if (!user || !user.roles || !Array.isArray(user.roles)) return false;
    // Super Admin and Sub Admin have every permission
    if (hasAllPermissions(user)) return true;

    return user.roles.some(role => {
      const permissions = role.permissions?.[resource];
      return permissions?.[action] === true;
    });
  };

  return { hasPermission };
};

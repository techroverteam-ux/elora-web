import { useAuth } from "@/src/context/AuthContext";

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (resource: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
    if (!user || !user.roles || !Array.isArray(user.roles)) return false;

    return user.roles.some(role => {
      const permissions = role.permissions?.[resource];
      return permissions?.[action] === true;
    });
  };

  return { hasPermission };
};

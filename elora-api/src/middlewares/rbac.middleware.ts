import { Request, Response, NextFunction } from "express";

/**
 * @param resource - The key in your permissions map (e.g., 'users', 'roles', 'reports')
 * @param action - The specific boolean flag to check ('view', 'create', 'edit', 'delete')
 */
export const checkPermission = (
  resource: string,
  action: "view" | "create" | "edit" | "delete",
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.role) {
        res.status(403).json({ message: "Access denied. No role assigned." });
        return;
      }

      // Access the Mongoose Map
      const rolePermissions = req.user.role.permissions;

      // Check if the resource exists in the role's permissions
      const resourcePermission = rolePermissions.get(resource);

      if (!resourcePermission) {
        res.status(403).json({
          message: `Access denied. No permissions defined for module: ${resource}`,
        });
        return;
      }

      // Check the specific boolean flag
      if (!resourcePermission[action]) {
        res.status(403).json({
          message: `Access denied. You do not have '${action}' permission for ${resource}.`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error("RBAC Middleware Error:", error);
      res
        .status(500)
        .json({ message: "Internal Server Error during authorization" });
    }
  };
};

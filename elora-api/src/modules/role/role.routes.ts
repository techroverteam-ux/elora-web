import express from "express";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "./role.controller";
import { protect } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/rbac.middleware";

const router = express.Router();

router.use(protect);

// PERMANENT FIX: Permission is SINGULAR ("role")
router
  .route("/")
  .post(checkPermission("role", "create"), createRole)
  .get(checkPermission("role", "view"), getAllRoles);

router
  .route("/:id")
  .get(checkPermission("role", "view"), getRoleById)
  .put(checkPermission("role", "edit"), updateRole)
  .delete(checkPermission("role", "delete"), deleteRole);

export default router;

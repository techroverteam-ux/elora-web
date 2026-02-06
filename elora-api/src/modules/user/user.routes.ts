import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersByRole,
} from "./user.controller";
import { protect } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/rbac.middleware";

const router = express.Router();

router.use(protect);

// PERMANENT FIX: Permission is SINGULAR ("user")
router
  .route("/")
  .post(checkPermission("user", "create"), createUser)
  .get(checkPermission("user", "view"), getAllUsers);

router
  .route("/:id")
  .get(checkPermission("user", "view"), getUserById)
  .put(checkPermission("user", "edit"), updateUser)
  .delete(checkPermission("user", "delete"), deleteUser);

router.get("/role/:roleCode", protect, getUsersByRole);

export default router;

import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersByRole,
  exportUsers
} from "./user.controller";
import { protect } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/rbac.middleware";

const router = express.Router();

router.use(protect);

// FIX: Changed "user" to "users" to match DB permissions
router.get("/export", checkPermission("users", "view"), exportUsers);

router
  .route("/")
  .post(checkPermission("users", "create"), createUser)
  .get(checkPermission("users", "view"), getAllUsers);

router
  .route("/:id")
  .get(checkPermission("users", "view"), getUserById)
  .put(checkPermission("users", "edit"), updateUser)
  .delete(checkPermission("users", "delete"), deleteUser);

router.get("/role/:roleCode", protect, getUsersByRole);

export default router;

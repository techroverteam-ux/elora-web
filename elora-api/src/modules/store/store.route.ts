import express from "express";
import multer from "multer"; // Import Multer
import {
  createStore,
  getAllStores,
  getStoreById,
  updateStore,
  deleteStore,
  uploadStoresBulk,
  assignStoresBulk,
  submitRecce,
  generateReccePPT,
  reviewRecce,
  submitInstallation,
  generateInstallationPPT,
} from "./store.controller";
import { protect } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/rbac.middleware";

const router = express.Router();

// --- MULTER CONFIGURATION ---
// We save files temporarily to an 'uploads/' folder.
// The controller will delete the file after processing.
const upload = multer({ dest: "uploads/" });

router.use(protect);

router.post(
  "/upload",
  checkPermission("store", "create"),
  upload.array("files"), // CHANGED FROM single("file") TO array("files")
  uploadStoresBulk,
);

// 2. Standard CRUD Routes
router
  .route("/")
  .post(checkPermission("store", "create"), createStore)
  .get(checkPermission("store", "view"), getAllStores);

router
  .route("/:id")
  .get(checkPermission("store", "view"), getStoreById)
  .put(checkPermission("store", "edit"), updateStore)
  .delete(checkPermission("store", "delete"), deleteStore);

router.post("/assign", checkPermission("store", "edit"), assignStoresBulk);

router.post(
  "/:id/recce",
  protect,
  upload.fields([
    { name: "front", maxCount: 1 },
    { name: "side", maxCount: 1 },
    { name: "closeUp", maxCount: 1 },
  ]),
  submitRecce,
);

router.get("/:id/ppt/recce", protect, generateReccePPT);

router.post("/:id/recce/review", checkPermission("store", "edit"), reviewRecce);

// NEW: Installation Submission Route
router.post(
  "/:id/installation",
  protect,
  upload.fields([{ name: "final", maxCount: 1 }]),
  submitInstallation,
);

// NEW: Installation PPT Route
router.get("/:id/ppt/installation", protect, generateInstallationPPT);

export default router;

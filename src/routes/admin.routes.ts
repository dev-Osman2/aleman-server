import { Router } from "express";
import { requireAdmin } from "../middleware/auth.middleware";
import { uploadExcelMiddleware } from "../middleware/upload.middleware";
import {
  getAdminStats,
  createBook,
  updateBook,
  deleteBook,
  getAdminOrders,
  updateOrderStatus,
  getAdminUsers,
  updateOrderAdminNote,
  clearAllOrders,
  verifyAdminSession,
} from "../controllers/admin.controller";
import {
  exportBooks,
  previewBooksImport,
  importBooks,
} from "../controllers/adminExcel.controller";

const router = Router();

router.use(requireAdmin);

router.get("/verify", verifyAdminSession);
router.get("/stats", getAdminStats);

router.get("/users", getAdminUsers);

// Excel Books Export & Import Routes
router.get("/books/export", exportBooks);
router.post(
  "/books/import-preview",
  uploadExcelMiddleware.single("file"),
  previewBooksImport
);
router.post(
  "/books/import",
  uploadExcelMiddleware.single("file"),
  importBooks
);

// Standard Books CRUD
router.post("/books", createBook);
router.put("/books/:id", updateBook);
router.delete("/books/:id", deleteBook);

router.get("/orders", getAdminOrders);
router.delete("/orders/clear-all", clearAllOrders);
router.patch("/orders/:id/status", updateOrderStatus);
router.patch("/orders/:id/note", updateOrderAdminNote);
router.patch("/orders/:id/admin-note", updateOrderAdminNote);

export default router;

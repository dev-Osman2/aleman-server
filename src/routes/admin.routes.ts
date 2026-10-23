import { Router } from "express";
import { requireAdmin } from "../middleware/auth.middleware";
import {
  getAdminStats,
  createBook,
  updateBook,
  deleteBook,
  getAdminOrders,
  updateOrderStatus,
} from "../controllers/admin.controller";

const router = Router();

// تطبيق الحماية على جميع مسارات الأدمن
router.use(requireAdmin);

// إحصائيات
router.get("/stats", getAdminStats);

// إدارة الكتب (CRUD Books)
router.post("/books", createBook);
router.put("/books/:id", updateBook);
router.delete("/books/:id", deleteBook);

// إدارة الطلبات (Orders Management)
router.get("/orders", getAdminOrders);
router.patch("/orders/:id/status", updateOrderStatus);

export default router;
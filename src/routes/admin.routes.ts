import { Router } from "express";
import { requireAdmin } from "../middleware/auth.middleware";
import {
  getAdminStats,
  createBook,
  updateBook,
  deleteBook,
  getAdminOrders,
  updateOrderStatus,
  getAdminUsers, // <-- استيراد الدالة الجديدة
} from "../controllers/admin.controller";

const router = Router();

router.use(requireAdmin);

// إحصائيات الأدمن
router.get("/stats", getAdminStats);

// عرض كل المستخدمين المسجلين (الإسم، الإيميل، الرقم)
router.get("/users", getAdminUsers);

// إدارة الكتب
router.post("/books", createBook);
router.put("/books/:id", updateBook);
router.delete("/books/:id", deleteBook);

// إدارة الطلبات
router.get("/orders", getAdminOrders);
router.patch("/orders/:id/status", updateOrderStatus);

export default router;
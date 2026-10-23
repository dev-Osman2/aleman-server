import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  updateMyOrder,
  cancelMyOrder,
} from "../controllers/order.controller";

const router = Router();

// مسارات الطلبات تتطلب تسجيل دخول المستخدم
router.use(requireAuth);

// [C] إنشاء طلب جديد
router.post("/", createOrder);

// [R] قراءة قائمة الطلبات
router.get("/my-orders", getMyOrders);

// [R] قراءة تفاصيل طلب فردي
router.get("/:id", getMyOrderById);

// [U] تعديل بيانات التوصيل للطلب
router.put("/:id", updateMyOrder);

// [D] إلغاء الطلب واسترجاع المخزون
router.patch("/:id/cancel", cancelMyOrder);

export default router;
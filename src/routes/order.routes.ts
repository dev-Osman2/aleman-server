import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createOrder,
  createFeedback,
  getMyOrders,
  getMyOrderById,
  updateMyOrder,
} from "../controllers/order.controller";

const router = Router();

// مسارات الطلبات تتطلب تسجيل دخول المستخدم
router.use(requireAuth);

// [C] إنشاء طلب جديد
router.post("/", createOrder);

// إرسال رأي أو طلب توفير كتاب
router.post("/feedback", createFeedback);

// [R] قراءة قائمة الطلبات
router.get("/my-orders", getMyOrders);

// [R] قراءة تفاصيل طلب فردي
router.get("/:id", getMyOrderById);


export default router;
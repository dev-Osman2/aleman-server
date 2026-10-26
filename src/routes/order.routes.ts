import { requireAuth, optionalAuth } from "../middleware/auth.middleware";
import {
  createOrder,
  createFeedback,
  getMyOrders,
  getMyOrderById,
  updateMyOrder,
} from "../controllers/order.controller";
import { Router } from "express";

const router = Router();

// إرسال المقترح متاح للجميع مع التقاط بيانات الحساب إن كان مسجلاً
router.post("/feedback", optionalAuth, createFeedback);

// المسارات التي تتطلب تسجيل الدخول
router.use(requireAuth);

router.post("/", createOrder);

router.get("/my-orders", getMyOrders);


router.get("/:id", getMyOrderById);


export default router;
import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { createOrder, getMyOrders } from "../controllers/order.controller";

const router = Router();

// حماية مسارات الطلبات: مخصصة للمستخدمين المسجلين فقط
router.use(requireAuth);

// POST /api/orders (إنشاء طلب جديد)
router.post("/", createOrder);

// GET /api/orders/my-orders (استعراض طلبات المستخدم)
router.get("/my-orders", getMyOrders);

export default router;
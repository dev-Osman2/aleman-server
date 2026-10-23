import { Request, Response } from "express";
import { PaymentMethod, OrderStatus } from "@prisma/client";
import { prisma } from "../prisma";

interface OrderItemInput {
  bookId: string;
  quantity: number;
}

export const createOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user.id; // مأخوذ مباشرة من التوكن المحقق عبر requireAuth
    const { address, notes, paymentMethod, transferNumber, items } = req.body;

    // 1. التحقق من صحة المدخلات الإلزامية
    if (
      !address ||
      !paymentMethod ||
      !transferNumber ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      res.status(400).json({
        success: false,
        message:
          "Required order data missing: address, paymentMethod, transferNumber, items",
      });
      return;
    }

    // التحقق من طريقة الدفع
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      res.status(400).json({
        success: false,
        message: `Invalid payment method. Allowed values: ${Object.values(PaymentMethod).join(", ")}`,
      });
      return;
    }

    const deliveryFee = 20; // رسوم التوصيل الثابتة للمنازل

    // 2. تشغيل المعاملة الآمنة (Prisma Transaction)
    const newOrder = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsToCreate = [];

      for (const item of items as OrderItemInput[]) {
        if (!item.bookId || !item.quantity || item.quantity <= 0) {
          throw new Error("Invalid item format or quantity");
        }

        // جلب الكتاب وفحص المخزون الحالي داخل سياق المعاملة
        const book = await tx.book.findUnique({
          where: { id: item.bookId },
        });

        if (!book) {
          throw new Error(`Book not found with ID: ${item.bookId}`);
        }

        if (book.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for "${book.title}". Available: ${book.quantity}, Requested: ${item.quantity}`,
          );
        }

        // إنقاص المخزون فورياً
        await tx.book.update({
          where: { id: book.id },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        const itemTotal = book.price * item.quantity;
        subtotal += itemTotal;

        orderItemsToCreate.push({
          bookId: book.id,
          quantity: item.quantity,
          priceAtBuy: book.price,
        });
      }

      const total = subtotal + deliveryFee;

      // إنشاء الطلب وحفظ عناصره في جدول OrderItem
      const createdOrder = await tx.order.create({
        data: {
          userId,
          address,
          notes,
          paymentMethod,
          transferNumber,
          subtotal,
          deliveryFee,
          total,
          status: OrderStatus.PENDING,
          items: {
            create: orderItemsToCreate,
          },
        },
        include: {
          items: {
            include: {
              book: {
                select: { code: true, title: true, image: true },
              },
            },
          },
        },
      });

      return createdOrder;
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: newOrder,
    });
  } catch (error: any) {
    console.error("Order transaction error:", error);
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to process order",
    });
  }
};

// جلب تاريخ طلبات المستخدم المسجل فقط
export const getMyOrders = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            book: {
              select: { code: true, title: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching user orders",
    });
  }
};

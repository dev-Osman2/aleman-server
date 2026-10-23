import { Request, Response } from "express";
import { OrderStatus } from "@prisma/client";
import { prisma } from "../prisma";

// 1. جلب إحصائيات لوحة التحكم
export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalBooks, totalOrders, totalUsers, revenueResult] = await Promise.all([
      prisma.book.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: "CONFIRMED" },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBooks,
        totalOrders,
        totalUsers,
        totalRevenue: revenueResult._sum.total || 0,
        authenticatedAdmin: {
          name: req.user.name,
          email: req.user.email,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 2. إضافة كتاب جديد (Create Book)
export const createBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      code,
      title,
      description,
      fullDescription,
      price,
      oldPrice,
      quantity,
      category,
      image,
      author,
      publisher,
      pagesCount,
    } = req.body;

    if (!code || !title || !description || price === undefined || !category || !image) {
      res.status(400).json({
        success: false,
        message: "Required fields missing: code, title, description, price, category, image",
      });
      return;
    }

    // التحقق من عدم تكرار كود الكتاب
    const existingBook = await prisma.book.findUnique({
      where: { code: Number(code) },
    });

    if (existingBook) {
      res.status(409).json({
        success: false,
        message: `Book with code ${code} already exists`,
      });
      return;
    }

    const newBook = await prisma.book.create({
      data: {
        code: Number(code),
        title,
        description,
        fullDescription,
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        quantity: quantity !== undefined ? Number(quantity) : 0,
        category,
        image,
        author,
        publisher,
        pagesCount: pagesCount ? Number(pagesCount) : null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: newBook,
    });
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({ success: false, message: "Internal server error while creating book" });
  }
};

// 3. تعديل بيانات أو مخزون كتاب (Update Book)
export const updateBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // فحص وجود الكتاب أولاً
    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      res.status(404).json({ success: false, message: "Book not found" });
      return;
    }

    // تجهيز البيانات المراد تعديلها مع معالجة الأرقام
    const dataToUpdate: any = { ...updateData };
    if (updateData.code !== undefined) dataToUpdate.code = Number(updateData.code);
    if (updateData.price !== undefined) dataToUpdate.price = parseFloat(updateData.price);
    if (updateData.oldPrice !== undefined) dataToUpdate.oldPrice = parseFloat(updateData.oldPrice);
    if (updateData.quantity !== undefined) dataToUpdate.quantity = Number(updateData.quantity);
    if (updateData.pagesCount !== undefined) dataToUpdate.pagesCount = Number(updateData.pagesCount);

    const updatedBook = await prisma.book.update({
      where: { id },
      data: dataToUpdate,
    });

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook,
    });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ success: false, message: "Internal server error while updating book" });
  }
};

// 4. حذف كتاب من النظام (Delete Book)
export const deleteBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // التحقق من عدم وجود طلبات مرتبطة بهذا الكتاب
    const orderedItemsCount = await prisma.orderItem.count({
      where: { bookId: id },
    });

    if (orderedItemsCount > 0) {
      res.status(400).json({
        success: false,
        message: "Cannot delete book that is referenced in existing customer orders. Set quantity to 0 instead.",
      });
      return;
    }

    await prisma.book.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ success: false, message: "Internal server error while deleting book" });
  }
};

// 5. جلب كافة الطلبات مع التفاصيل للأدمن (Get All Orders)
export const getAdminOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const orders = await prisma.order.findMany({
      where: status && typeof status === "string" ? { status: status as OrderStatus } : {},
      include: {
        user: {
          select: { name: true, phone: true, email: true },
        },
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
    console.error("Error fetching admin orders:", error);
    res.status(500).json({ success: false, message: "Internal server error while fetching orders" });
  }
};

// 6. تغيير حالة الطلب: تأكيد أو إلغاء (Update Order Status)
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // فحص صلاحية الحالة المرسلة
    if (!status || !Object.values(OrderStatus).includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Permitted values: ${Object.values(OrderStatus).join(", ")}`,
      });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: { status: status as OrderStatus },
      include: {
        user: { select: { name: true, phone: true } },
      },
    });

    res.status(200).json({
      success: true,
      message: `Order #${id} status updated to ${status}`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, message: "Internal server error while updating status" });
  }
};
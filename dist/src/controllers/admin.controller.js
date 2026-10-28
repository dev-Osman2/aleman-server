"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdminSession = exports.clearAllOrders = exports.updateOrderAdminNote = exports.updateOrderStatus = exports.getAdminOrders = exports.getAdminUsers = exports.deleteBook = exports.updateBook = exports.createBook = exports.getAdminStats = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../prisma");
const telegramService_1 = require("../services/telegramService");
const getAdminStats = async (req, res) => {
    try {
        const [totalBooks, totalOrders, totalUsers, revenueResult] = await Promise.all([
            prisma_1.prisma.book.count(),
            prisma_1.prisma.order.count(),
            prisma_1.prisma.user.count(),
            prisma_1.prisma.order.aggregate({
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
    }
    catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getAdminStats = getAdminStats;
const createBook = async (req, res) => {
    try {
        const { code, title, description, fullDescription, price, oldPrice, quantity, category, image, author, publisher, pagesCount, } = req.body;
        if (!code ||
            !title ||
            !description ||
            price === undefined ||
            !category ||
            !image) {
            res.status(400).json({
                success: false,
                message: "Required fields missing: code, title, description, price, category, image",
            });
            return;
        }
        const existingBook = await prisma_1.prisma.book.findUnique({
            where: { code: String(code) },
        });
        if (existingBook) {
            res.status(409).json({
                success: false,
                message: `Book with code ${code} already exists`,
            });
            return;
        }
        const newBook = await prisma_1.prisma.book.create({
            data: {
                code: String(code),
                title,
                description,
                fullDescription,
                price: Math.round(Number(price)),
                oldPrice: oldPrice ? Math.round(Number(oldPrice)) : null,
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
    }
    catch (error) {
        console.error("Error creating book:", error);
        res
            .status(500)
            .json({
            success: false,
            message: "Internal server error while creating book",
        });
    }
};
exports.createBook = createBook;
const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const book = await prisma_1.prisma.book.findUnique({
            where: { id },
        });
        if (!book) {
            res.status(404).json({ success: false, message: "Book not found" });
            return;
        }
        const dataToUpdate = { ...updateData };
        if (updateData.code !== undefined)
            dataToUpdate.code = String(updateData.code);
        if (updateData.price !== undefined)
            dataToUpdate.price = Math.round(Number(updateData.price));
        if (updateData.oldPrice !== undefined)
            dataToUpdate.oldPrice = updateData.oldPrice
                ? Math.round(Number(updateData.oldPrice))
                : null;
        if (updateData.quantity !== undefined)
            dataToUpdate.quantity = Number(updateData.quantity);
        if (updateData.pagesCount !== undefined)
            dataToUpdate.pagesCount = updateData.pagesCount
                ? Number(updateData.pagesCount)
                : null;
        const updatedBook = await prisma_1.prisma.book.update({
            where: { id },
            data: dataToUpdate,
        });
        res.status(200).json({
            success: true,
            message: "Book updated successfully",
            data: updatedBook,
        });
    }
    catch (error) {
        console.error("Error updating book:", error);
        res
            .status(500)
            .json({
            success: false,
            message: "Internal server error while updating book",
        });
    }
};
exports.updateBook = updateBook;
const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;
        const orderedItemsCount = await prisma_1.prisma.orderItem.count({
            where: { bookId: id },
        });
        if (orderedItemsCount > 0) {
            res.status(400).json({
                success: false,
                message: "Cannot delete book that is referenced in existing customer orders. Set quantity to 0 instead.",
            });
            return;
        }
        await prisma_1.prisma.book.delete({
            where: { id },
        });
        res.status(200).json({
            success: true,
            message: "Book deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting book:", error);
        res
            .status(500)
            .json({
            success: false,
            message: "Internal server error while deleting book",
        });
    }
};
exports.deleteBook = deleteBook;
const getAdminUsers = async (req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            where: {
                role: {
                    not: "ADMIN",
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
                _count: {
                    select: { orders: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    }
    catch (error) {
        console.error("Error fetching users for admin:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching registered users",
        });
    }
};
exports.getAdminUsers = getAdminUsers;
const getAdminOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const orders = await prisma_1.prisma.order.findMany({
            where: status && typeof status === "string"
                ? { status: status }
                : {},
            include: {
                user: {
                    select: { name: true, phone: true, email: true, role: true },
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
    }
    catch (error) {
        console.error("Error fetching admin orders:", error);
        res
            .status(500)
            .json({
            success: false,
            message: "Internal server error while fetching orders",
        });
    }
};
exports.getAdminOrders = getAdminOrders;
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !Object.values(client_1.OrderStatus).includes(status)) {
            res.status(400).json({
                success: false,
                message: `Invalid status. Permitted values: ${Object.values(client_1.OrderStatus).join(", ")}`,
            });
            return;
        }
        const orderId = Number(id);
        const existingOrder = await prisma_1.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                user: { select: { name: true, phone: true, email: true, role: true } },
            },
        });
        if (!existingOrder) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }
        const previousStatus = existingOrder.status;
        const targetStatus = status;
        let updatedOrder = await prisma_1.prisma.$transaction(async (tx) => {
            if (targetStatus === client_1.OrderStatus.CANCELLED &&
                previousStatus !== client_1.OrderStatus.CANCELLED) {
                for (const item of existingOrder.items) {
                    if (item.bookId) {
                        await tx.book.update({
                            where: { id: item.bookId },
                            data: {
                                quantity: { increment: item.quantity },
                            },
                        });
                    }
                }
            }
            if (previousStatus === client_1.OrderStatus.CANCELLED &&
                (targetStatus === client_1.OrderStatus.PENDING ||
                    targetStatus === client_1.OrderStatus.CONFIRMED)) {
                for (const item of existingOrder.items) {
                    if (item.bookId) {
                        await tx.book.update({
                            where: { id: item.bookId },
                            data: {
                                quantity: { decrement: item.quantity },
                            },
                        });
                    }
                }
            }
            return await tx.order.update({
                where: { id: orderId },
                data: {
                    status: targetStatus,
                    ...(targetStatus === client_1.OrderStatus.CANCELLED
                        ? { telegramMessageId: null }
                        : {}),
                },
                include: {
                    user: {
                        select: { name: true, phone: true, email: true, role: true },
                    },
                    items: {
                        include: {
                            book: {
                                select: { code: true, title: true, image: true },
                            },
                        },
                    },
                },
            });
        });
        if (targetStatus === client_1.OrderStatus.CONFIRMED &&
            !(0, telegramService_1.isCashierOrder)(updatedOrder)) {
            try {
                const messageId = await (0, telegramService_1.notifyConfirmedOrder)(updatedOrder);
                if (messageId) {
                    updatedOrder = await prisma_1.prisma.order.update({
                        where: { id: orderId },
                        data: { telegramMessageId: messageId },
                        include: {
                            user: {
                                select: { name: true, phone: true, email: true, role: true },
                            },
                            items: {
                                include: {
                                    book: {
                                        select: { code: true, title: true, image: true },
                                    },
                                },
                            },
                        },
                    });
                }
            }
            catch (tgError) {
                console.error("Failed to dispatch order to Telegram:", tgError);
            }
        }
        else if (targetStatus === client_1.OrderStatus.CANCELLED) {
            if (existingOrder.telegramMessageId) {
                try {
                    await (0, telegramService_1.deleteTelegramMessage)(existingOrder.telegramMessageId);
                }
                catch (tgError) {
                    console.error("Failed to delete order message from Telegram:", tgError);
                }
            }
        }
        res.status(200).json({
            success: true,
            message: `Order #${id} status updated to ${status}`,
            data: updatedOrder,
        });
    }
    catch (error) {
        console.error("Error updating order status:", error);
        res
            .status(500)
            .json({
            success: false,
            message: "Internal server error while updating status",
        });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const updateOrderAdminNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNote } = req.body;
        const orderId = Number(id);
        if (isNaN(orderId)) {
            res.status(400).json({ success: false, message: "Invalid order ID" });
            return;
        }
        const existingOrder = await prisma_1.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!existingOrder) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }
        const trimmedNote = typeof adminNote === "string" && adminNote.trim() !== ""
            ? adminNote.trim()
            : null;
        const updatedOrder = await prisma_1.prisma.order.update({
            where: { id: orderId },
            data: { adminNote: trimmedNote },
            include: {
                user: { select: { name: true, phone: true, email: true, role: true } },
                items: {
                    include: {
                        book: {
                            select: { code: true, title: true, image: true },
                        },
                    },
                },
            },
        });
        res.status(200).json({
            success: true,
            message: "Order admin note updated successfully",
            data: updatedOrder,
        });
    }
    catch (error) {
        console.error("Error updating order admin note:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error while updating admin note",
        });
    }
};
exports.updateOrderAdminNote = updateOrderAdminNote;
const clearAllOrders = async (req, res) => {
    try {
        const ordersWithTelegram = await prisma_1.prisma.order.findMany({
            where: {
                telegramMessageId: {
                    not: null,
                },
            },
            select: {
                telegramMessageId: true,
            },
        });
        const messageIds = ordersWithTelegram
            .map((order) => order.telegramMessageId)
            .filter((id) => id !== null && typeof id === "number");
        const telegramMessagesDeleted = await (0, telegramService_1.clearAllTelegramMessages)(messageIds);
        const [deletedItems, deletedOrders] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.orderItem.deleteMany({}),
            prisma_1.prisma.order.deleteMany({}),
        ]);
        res.status(200).json({
            success: true,
            message: "تم تفريغ قاعدة بيانات الطلبات بالكامل ومسح رسائل التلجرام",
            data: {
                deletedOrdersCount: deletedOrders.count,
                deletedItemsCount: deletedItems.count,
                telegramMessagesDeleted,
            },
        });
    }
    catch (error) {
        console.error("Error clearing all orders:", error);
        res.status(500).json({
            success: false,
            message: "فشل في مسح وتفريغ الطلبات",
        });
    }
};
exports.clearAllOrders = clearAllOrders;
const verifyAdminSession = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "ADMIN") {
            res.status(403).json({
                success: false,
                message: "Forbidden - Admin access required",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Admin verified successfully",
            data: {
                user: {
                    id: req.user.id,
                    name: req.user.name,
                    email: req.user.email,
                    phone: req.user.phone,
                    role: req.user.role,
                },
            },
        });
    }
    catch (error) {
        console.error("Error verifying admin session:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during verification",
        });
    }
};
exports.verifyAdminSession = verifyAdminSession;

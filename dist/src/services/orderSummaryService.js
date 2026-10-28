"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderSummary = void 0;
const prisma_1 = require("../prisma");
const getOrderSummary = async () => {
    const [totalOrders, pendingOrders, confirmedOrders, cancelledOrders, salesAggregate, itemsAggregate, recentOrders,] = await Promise.all([
        prisma_1.prisma.order.count(),
        prisma_1.prisma.order.count({ where: { status: "PENDING" } }),
        prisma_1.prisma.order.count({ where: { status: "CONFIRMED" } }),
        prisma_1.prisma.order.count({ where: { status: "CANCELLED" } }),
        prisma_1.prisma.order.aggregate({
            where: {
                status: { not: "CANCELLED" },
            },
            _sum: {
                total: true,
                subtotal: true,
                deliveryFee: true,
            },
        }),
        prisma_1.prisma.orderItem.aggregate({
            where: {
                order: {
                    status: { not: "CANCELLED" },
                },
            },
            _sum: {
                quantity: true,
            },
        }),
        prisma_1.prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                items: {
                    include: {
                        book: {
                            select: {
                                id: true,
                                code: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        }),
    ]);
    return {
        overview: {
            totalOrders,
            pendingOrders,
            confirmedOrders,
            cancelledOrders,
            totalSalesRevenue: salesAggregate._sum.total || 0,
            totalSubtotal: salesAggregate._sum.subtotal || 0,
            totalDeliveryFees: salesAggregate._sum.deliveryFee || 0,
            totalBooksSold: itemsAggregate._sum.quantity || 0,
        },
        byStatus: {
            PENDING: pendingOrders,
            CONFIRMED: confirmedOrders,
            CANCELLED: cancelledOrders,
        },
        recentOrders,
    };
};
exports.getOrderSummary = getOrderSummary;
exports.default = {
    getOrderSummary: exports.getOrderSummary,
};

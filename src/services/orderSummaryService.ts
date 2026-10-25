import { prisma } from "../prisma";

export const getOrderSummary = async () => {
  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    cancelledOrders,
    salesAggregate,
    itemsAggregate,
    recentOrders,
  ] = await Promise.all([
    // 1. Total orders count
    prisma.order.count(),

    // 2. Pending orders count
    prisma.order.count({ where: { status: "PENDING" } }),

    // 3. Confirmed orders count
    prisma.order.count({ where: { status: "CONFIRMED" } }),

    // 4. Cancelled orders count
    prisma.order.count({ where: { status: "CANCELLED" } }),

    // 5. Total revenue and subtotal from non-cancelled orders
    prisma.order.aggregate({
      where: {
        status: { not: "CANCELLED" },
      },
      _sum: {
        total: true,
        subtotal: true,
        deliveryFee: true,
      },
    }),

    // 6. Total books quantity sold from non-cancelled orders
    prisma.orderItem.aggregate({
      where: {
        order: {
          status: { not: "CANCELLED" },
        },
      },
      _sum: {
        quantity: true,
      },
    }),

    // 7. Recent 5 orders
    prisma.order.findMany({
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

export default {
  getOrderSummary,
};

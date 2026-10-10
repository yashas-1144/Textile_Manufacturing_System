
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const auth = await requireRole([
    "ADMIN",
    "MANAGER",
    "DISPATCH",
    "FINANCE",
    "OPERATOR",
  ]);

  if (auth.error) return auth.error;

  const [
    orderCounts,
    rollCounts,
    qualityCounts,
    dispatchCounts,
    recentOrders,
    recentDispatches,
  ] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    prisma.finishedRoll.aggregate({
      _count: { id: true },
      _sum: {
        quantity: true,
        dispatchedQuantity: true,
      },
    }),

    prisma.finishedRoll.groupBy({
      by: ["qualityStatus"],
      _count: { id: true },
    }),

    prisma.dispatch.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        fabricType: true,
        colour: true,
        quantity: true,
        status: true,
        createdAt: true,
        buyer: {
          select: { name: true },
        },
      },
    }),

    prisma.dispatch.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        dispatchNo: true,
        status: true,
        vehicleNo: true,
        createdAt: true,
        order: {
          select: { orderNumber: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    orders: {
      total: orderCounts.reduce((sum, item) => sum + item._count.id, 0),
      byStatus: Object.fromEntries(
        orderCounts.map((item) => [item.status, item._count.id])
      ),
    },

    rolls: {
      total: rollCounts._count.id,
      totalQuantity: Number(rollCounts._sum.quantity ?? 0),
      dispatchedQuantity: Number(
        rollCounts._sum.dispatchedQuantity ?? 0
      ),
      availableQuantity: Number(
        (Number(rollCounts._sum.quantity ?? 0) -
          Number(rollCounts._sum.dispatchedQuantity ?? 0)).toFixed(3)
      ),
      qualityByStatus: Object.fromEntries(
        qualityCounts.map((item) => [
          item.qualityStatus,
          item._count.id,
        ])
      ),
    },

    dispatches: {
      total: dispatchCounts.reduce(
        (sum, item) => sum + item._count.id,
        0
      ),
      byStatus: Object.fromEntries(
        dispatchCounts.map((item) => [item.status, item._count.id])
      ),
    },

    recentOrders,
    recentDispatches,
  });
}

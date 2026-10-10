
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireRole([
    "ADMIN",
    "MANAGER",
    "DISPATCH",
    "FINANCE",
  ]);

  if (auth.error) return auth.error;

  const params = request.nextUrl.searchParams;
  const fromParam = params.get("from");
  const toParam = params.get("to");

  const from = fromParam ? new Date(fromParam) : null;
  const to = toParam ? new Date(toParam) : null;

  if (
    (fromParam && (!from || Number.isNaN(from.getTime()))) ||
    (toParam && (!to || Number.isNaN(to.getTime())))
  ) {
    return NextResponse.json(
      { error: "Invalid date. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  if (from && to && from > to) {
    return NextResponse.json(
      { error: "'from' must be earlier than or equal to 'to'" },
      { status: 400 }
    );
  }

  // Include the entire "to" day when YYYY-MM-DD is supplied.
  if (to && toParam && /^\d{4}-\d{2}-\d{2}$/.test(toParam)) {
    to.setUTCHours(23, 59, 59, 999);
  }

  const dateFilter =
    from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {};

  const [
    orders,
    dispatches,
    invoices,
    payments,
    expenses,
    rolls,
  ] = await Promise.all([
    prisma.order.findMany({
      where: dateFilter,
      select: {
        id: true,
        orderNumber: true,
        fabricType: true,
        colour: true,
        quantity: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.dispatch.findMany({
      where: dateFilter,
      select: {
        id: true,
        dispatchNo: true,
        status: true,
        orderId: true,
        createdAt: true,
        dispatchedAt: true,
        deliveredAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.invoice.findMany({
      where: dateFilter,
      select: {
        id: true,
        invoiceNo: true,
        subtotal: true,
        taxAmount: true,
        total: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.payment.findMany({
      where: {
        ...(from || to
          ? {
              paidAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
        invoice: { status: { not: "VOID" } },
      },
      select: {
        id: true,
        invoiceId: true,
        amount: true,
        reference: true,
        paidAt: true,
      },
      orderBy: { paidAt: "desc" },
    }),

    prisma.expense.findMany({
      where: {
        ...(from || to
          ? {
              incurredAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      select: {
        id: true,
        orderId: true,
        category: true,
        description: true,
        amount: true,
        incurredAt: true,
      },
      orderBy: { incurredAt: "desc" },
    }),

    prisma.finishedRoll.findMany({
      where: dateFilter,
      select: {
        id: true,
        rollCode: true,
        orderId: true,
        quantity: true,
        dispatchedQuantity: true,
        qualityStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const sum = (values: { amount: unknown }[]) =>
    Number(
      values
        .reduce((total, item) => total + Number(item.amount), 0)
        .toFixed(2)
    );

  return NextResponse.json({
    period: {
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
    },
    summary: {
      orderCount: orders.length,
      dispatchCount: dispatches.length,
      invoiceCount: invoices.filter((i) => i.status !== "VOID").length,
      paymentCount: payments.length,
      expenseCount: expenses.length,
      rollCount: rolls.length,
      invoicedAmount: sum(
        invoices
          .filter((i) => i.status !== "VOID")
          .map((i) => ({ amount: i.total }))
      ),
      paymentsReceived: sum(payments),
      expensesRecorded: sum(expenses),
      rollsProduced: Number(
        rolls.reduce((total, roll) => total + Number(roll.quantity), 0).toFixed(3)
      ),
      rollsDispatched: Number(
        rolls.reduce(
          (total, roll) => total + Number(roll.dispatchedQuantity),
          0
        ).toFixed(3)
      ),
    },
    orders,
    dispatches,
    invoices,
    payments,
    expenses,
    rolls,
  });
}

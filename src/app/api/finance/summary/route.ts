
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/finance/summary
export async function GET() {
  const auth = await requireRole(["ADMIN", "MANAGER", "FINANCE"]);
  if (auth.error) return auth.error;

  const [invoiceTotals, paymentTotals, expenseTotals, expensesByCategory] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: { status: { not: "VOID" } },
        _sum: { subtotal: true, taxAmount: true, total: true },
        _count: { id: true },
      }),

      prisma.payment.aggregate({
        where: { invoice: { status: { not: "VOID" } } },
        _sum: { amount: true },
        _count: { id: true },
      }),

      prisma.expense.aggregate({
        _sum: { amount: true },
        _count: { id: true },
      }),

      prisma.expense.groupBy({
        by: ["category"],
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { category: "asc" },
      }),
    ]);

  const totalInvoiced = Number(invoiceTotals._sum.total ?? 0);
  const paymentsReceived = Number(paymentTotals._sum.amount ?? 0);
  const totalExpenses = Number(expenseTotals._sum.amount ?? 0);

  // Calculate balances per invoice to avoid counting payments
  // against the wrong invoice.
  const invoices = await prisma.invoice.findMany({
    where: { status: { not: "VOID" } },
    select: {
      id: true,
      invoiceNo: true,
      total: true,
      status: true,
      payments: { select: { amount: true } },
    },
  });

  const outstandingInvoices = invoices.map((invoice) => {
    const paid = invoice.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    return {
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      total: Number(invoice.total),
      paid: Number(paid.toFixed(2)),
      outstanding: Number(
        Math.max(0, Number(invoice.total) - paid).toFixed(2)
      ),
      status: invoice.status,
    };
  });

  const outstandingBalance = outstandingInvoices.reduce(
    (sum, invoice) => sum + invoice.outstanding,
    0
  );

  return NextResponse.json({
    summary: {
      totalInvoiced: Number(totalInvoiced.toFixed(2)),
      paymentsReceived: Number(paymentsReceived.toFixed(2)),
      outstandingBalance: Number(outstandingBalance.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netCashFlow: Number(
        (paymentsReceived - totalExpenses).toFixed(2)
      ),
      invoiceCount: invoiceTotals._count.id,
      paymentCount: paymentTotals._count.id,
      expenseCount: expenseTotals._count.id,
    },
    expensesByCategory: expensesByCategory.map((item) => ({
      category: item.category,
      total: Number((item._sum.amount ?? 0).toString()),
      count: item._count.id,
    })),
    outstandingInvoices,
  });
}

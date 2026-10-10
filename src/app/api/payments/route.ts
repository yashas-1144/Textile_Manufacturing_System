
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { positiveIdSchema } from "@/lib/ids";

const roles = ["ADMIN", "MANAGER", "FINANCE"];

const paymentSchema = z.object({
  invoiceId: positiveIdSchema,
  amount: z
    .number()
    .positive()
    .finite()
    .refine(
      (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
      "Amount must have at most two decimal places"
    ),
  reference: z.string().trim().max(100).optional(),
});

// GET /api/payments
export async function GET() {
  const auth = await requireRole(roles);
  if (auth.error) return auth.error;

  const payments = await prisma.payment.findMany({
    include: {
      invoice: {
        select: {
          id: true,
          invoiceNo: true,
          total: true,
          status: true,
        },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  return NextResponse.json({ payments });
}

// POST /api/payments
export async function POST(request: NextRequest) {
  const auth = await requireRole(roles);
  if (auth.error) return auth.error;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const parsed = paymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payment data",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { invoiceId, amount, reference } = parsed.data;
  const paymentAmount = new Prisma.Decimal(amount.toFixed(2));

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
          include: { payments: true },
        });

        if (!invoice) throw new Error("INVOICE_NOT_FOUND");
        if (invoice.status === "VOID") throw new Error("INVOICE_VOID");

        const paidSoFar = invoice.payments.reduce(
          (sum, payment) => sum.plus(payment.amount),
          new Prisma.Decimal(0)
        );

        const outstanding = new Prisma.Decimal(invoice.total).minus(
          paidSoFar
        );

        if (paymentAmount.greaterThan(outstanding)) {
          throw new Error("PAYMENT_EXCEEDS_BALANCE");
        }

        const payment = await tx.payment.create({
          data: {
            invoiceId,
            amount: paymentAmount,
            reference,
          },
        });

        const newPaidTotal = paidSoFar.plus(paymentAmount);

        const newStatus = newPaidTotal.greaterThanOrEqualTo(
          new Prisma.Decimal(invoice.total)
        )
          ? "PAID"
          : "PARTIALLY_PAID";

        const updatedInvoice = await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: newStatus },
        });

        return { payment, invoice: updatedInvoice };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVOICE_NOT_FOUND") {
        return NextResponse.json(
          { error: "Invoice not found" },
          { status: 404 }
        );
      }

      if (error.message === "INVOICE_VOID") {
        return NextResponse.json(
          { error: "Cannot pay a void invoice" },
          { status: 400 }
        );
      }

      if (error.message === "PAYMENT_EXCEEDS_BALANCE") {
        return NextResponse.json(
          { error: "Payment exceeds the outstanding invoice balance" },
          { status: 409 }
        );
      }
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Concurrent payment detected; check the balance and retry" },
        { status: 409 }
      );
    }

    console.error("Create payment failed:", error);

    return NextResponse.json(
      { error: "Unable to record payment" },
      { status: 500 }
    );
  }
}

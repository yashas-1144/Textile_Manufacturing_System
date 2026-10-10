
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { positiveIdSchema } from "@/lib/ids";

const roles = ["ADMIN", "MANAGER", "FINANCE"];

// GET /api/invoices
export async function GET() {
  const auth = await requireRole(roles);
  if (auth.error) return auth.error;

  const invoices = await prisma.invoice.findMany({
    include: {
      dispatch: {
        include: {
          order: { include: { buyer: true } },
          items: { include: { roll: true } },
        },
      },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invoices });
}

// POST /api/invoices
export async function POST(request: NextRequest) {
  const auth = await requireRole(["ADMIN", "MANAGER", "FINANCE"]);
  if (auth.error) return auth.error;

  const schema = z.object({
    invoiceNo: z.string().trim().min(1).max(50),
    dispatchId: positiveIdSchema,
    taxAmount: z.number().min(0).default(0),
  });

  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid invoice data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { invoiceNo, dispatchId, taxAmount } = parsed.data;

  const dispatch = await prisma.dispatch.findUnique({
    where: { id: dispatchId },
    include: {
      order: true,
      items: true,
      invoice: true,
    },
  });

  if (!dispatch) {
    return NextResponse.json(
      { error: "Dispatch not found" },
      { status: 404 }
    );
  }

  if (dispatch.status !== "DELIVERED") {
    return NextResponse.json(
      { error: "Only delivered dispatches can be invoiced" },
      { status: 400 }
    );
  }

  if (dispatch.items.length === 0) {
    return NextResponse.json(
      { error: "Cannot invoice a dispatch without items" },
      { status: 400 }
    );
  }

  if (dispatch.invoice) {
    return NextResponse.json(
      { error: "This dispatch already has an invoice" },
      { status: 409 }
    );
  }

  const subtotal = dispatch.items.reduce(
    (sum, item) =>
      sum + Number(item.quantity) * Number(dispatch.order.unitPrice),
    0
  );

  const total = subtotal + taxAmount;

  try {
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        dispatchId,
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        taxAmount: new Prisma.Decimal(taxAmount.toFixed(2)),
        total: new Prisma.Decimal(total.toFixed(2)),
      },
      include: {
        dispatch: {
          include: { order: true, items: true },
        },
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Invoice number or dispatch already has an invoice" },
        { status: 409 }
      );
    }

    throw error;
  }
}

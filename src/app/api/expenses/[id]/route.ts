
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { parsePositiveIntId, positiveIdSchema } from "@/lib/ids";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateSchema = z.object({
  orderId: positiveIdSchema.nullable().optional(),
  category: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  amount: z.number().positive().finite().optional(),
  incurredAt: z.string().datetime().optional(),
});

// GET /api/expenses/:id
export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  const auth = await requireRole(["ADMIN", "MANAGER", "FINANCE"]);
  if (auth.error) return auth.error;

  const id = parsePositiveIntId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { order: true },
  });

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  return NextResponse.json({ expense });
}

// PATCH /api/expenses/:id
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireRole(["ADMIN", "MANAGER", "FINANCE"]);
  if (auth.error) return auth.error;

  const id = parsePositiveIntId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(await request.json());

  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    return NextResponse.json(
      { error: "Provide valid expense fields to update", details: parsed.success ? undefined : parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const data = parsed.data;

  if (data.orderId) {
    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...(data.orderId !== undefined ? { orderId: data.orderId } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.amount !== undefined ? { amount: new Prisma.Decimal(data.amount.toFixed(2)) } : {}),
      ...(data.incurredAt !== undefined ? { incurredAt: new Date(data.incurredAt) } : {}),
    },
    include: { order: { select: { id: true, orderNumber: true } } },
  });

  return NextResponse.json({ expense });
}

// DELETE /api/expenses/:id — ADMIN only
export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  const auth = await requireRole(["ADMIN"]);
  if (auth.error) return auth.error;

  const id = parsePositiveIntId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ message: "Expense deleted successfully" });
}

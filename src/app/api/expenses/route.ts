
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const roles = ["ADMIN", "MANAGER", "FINANCE"];

const expenseSchema = z.object({
  orderId: z.string().min(1).optional().nullable(),
  category: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  amount: z.number().positive().finite(),
  incurredAt: z.string().datetime().optional(),
});

// GET /api/expenses
export async function GET(request: NextRequest) {
  const auth = await requireRole(roles);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const orderId = searchParams.get("orderId");

  const expenses = await prisma.expense.findMany({
    where: {
      ...(category ? { category: { equals: category, mode: "insensitive" as const } } : {}),
      ...(orderId ? { orderId } : {}),
    },
    include: {
      order: {
        select: { id: true, orderNumber: true, fabricType: true },
      },
    },
    orderBy: { incurredAt: "desc" },
  });

  return NextResponse.json({ expenses });
}

// POST /api/expenses
export async function POST(request: NextRequest) {
  const auth = await requireRole(["ADMIN", "MANAGER", "FINANCE"]);
  if (auth.error) return auth.error;

  const parsed = expenseSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid expense data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { orderId, category, description, amount, incurredAt } = parsed.data;

  if (orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
  }

  const expense = await prisma.expense.create({
    data: {
      orderId: orderId || null,
      category,
      description,
      amount: new Prisma.Decimal(amount.toFixed(2)),
      ...(incurredAt ? { incurredAt: new Date(incurredAt) } : {}),
    },
    include: {
      order: { select: { id: true, orderNumber: true } },
    },
  });

  return NextResponse.json({ expense }, { status: 201 });
}

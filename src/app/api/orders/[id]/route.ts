
import { NextResponse } from "next/server";
import { Prisma, OrderStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateOrderSchema = z.object({
  fabricType: z.string().trim().min(1).max(100).optional(),
  colour: z.string().trim().min(1).max(60).optional(),
  quantity: z.coerce.number().positive().finite().optional(),
  unitPrice: z.coerce.number().nonnegative().finite().optional(),
  deadline: z.string().datetime().nullable().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "Provide at least one field to update",
});

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  const auth = await requireRole(["ADMIN", "MANAGER", "DISPATCH", "FINANCE", "OPERATOR"]);
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { buyer: true, rolls: true, dispatches: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Get order failed:", error);
    return NextResponse.json({ error: "Unable to retrieve order" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  const auth = await requireRole(["ADMIN", "MANAGER"]);
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const body: unknown = await request.json();
    const parsed = updateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid order data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(data.fabricType !== undefined && { fabricType: data.fabricType }),
        ...(data.colour !== undefined && { colour: data.colour }),
        ...(data.quantity !== undefined && { quantity: new Prisma.Decimal(data.quantity) }),
        ...(data.unitPrice !== undefined && { unitPrice: new Prisma.Decimal(data.unitPrice) }),
        ...(data.deadline !== undefined && {
          deadline: data.deadline ? new Date(data.deadline) : null,
        }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: { buyer: true },
    });

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.error("Update order failed:", error);
    return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
  }
}

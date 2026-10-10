
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { positiveIdSchema } from "@/lib/ids";

export const runtime = "nodejs";

const createOrderSchema = z.object({
  orderNumber: z.string().trim().min(1).max(50),
  buyerId: positiveIdSchema,
  fabricType: z.string().trim().min(1).max(100),
  colour: z.string().trim().min(1).max(60),
  quantity: z.coerce.number().positive().finite(),
  unitPrice: z.coerce.number().nonnegative().finite(),
  deadline: z.string().datetime().optional().nullable(),
});

export async function GET() {
  const auth = await requireRole(["ADMIN", "MANAGER", "DISPATCH", "FINANCE", "OPERATOR"]);
  if (auth.error) return auth.error;

  try {
    const orders = await prisma.order.findMany({
      include: { buyer: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("List orders failed:", error);
    return NextResponse.json({ error: "Unable to retrieve orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "MANAGER"]);
  if (auth.error) return auth.error;

  try {
    const body: unknown = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid order data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const buyer = await prisma.buyer.findUnique({
      where: { id: data.buyerId },
      select: { id: true },
    });

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: data.orderNumber,
        buyerId: data.buyerId,
        fabricType: data.fabricType,
        colour: data.colour,
        quantity: new Prisma.Decimal(data.quantity),
        unitPrice: new Prisma.Decimal(data.unitPrice),
        deadline: data.deadline ? new Date(data.deadline) : null,
      },
      include: { buyer: true },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Order number already exists" }, { status: 409 });
    }

    console.error("Create order failed:", error);
    return NextResponse.json({ error: "Unable to create order" }, { status: 500 });
  }
}

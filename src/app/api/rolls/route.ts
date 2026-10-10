
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { positiveIdSchema } from "@/lib/ids";

export const runtime = "nodejs";

const createRollSchema = z.object({
  rollCode: z.string().trim().min(1).max(60),
  orderId: positiveIdSchema,
  machineCode: z.string().trim().max(60).nullable().optional(),
  quantity: z.coerce.number().positive().finite(),
});

export async function GET() {
  const auth = await requireRole([
    "ADMIN", "MANAGER", "DISPATCH", "FINANCE", "OPERATOR",
  ]);
  if (auth.error) return auth.error;

  try {
    const rolls = await prisma.finishedRoll.findMany({
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            fabricType: true,
            colour: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ rolls });
  } catch (error) {
    console.error("List rolls failed:", error);
    return NextResponse.json(
      { error: "Unable to retrieve finished rolls" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "MANAGER", "OPERATOR"]);
  if (auth.error) return auth.error;

  try {
    const body: unknown = await request.json();
    const parsed = createRollSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid roll data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot register a roll against a cancelled order" },
        { status: 409 },
      );
    }

    const roll = await prisma.finishedRoll.create({
      data: {
        rollCode: data.rollCode,
        orderId: data.orderId,
        machineCode: data.machineCode || null,
        quantity: new Prisma.Decimal(data.quantity),
      },
      include: {
        order: {
          select: { id: true, orderNumber: true, fabricType: true, colour: true },
        },
      },
    });

    return NextResponse.json({ roll }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Roll code already exists" },
        { status: 409 },
      );
    }

    console.error("Create roll failed:", error);
    return NextResponse.json(
      { error: "Unable to create finished roll" },
      { status: 500 },
    );
  }
}

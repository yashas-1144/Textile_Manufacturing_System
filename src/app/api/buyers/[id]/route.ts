
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const buyerUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(254).nullable()
    .or(z.literal("")).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "Provide at least one field to update",
});

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  const auth = await requireRole([
    "ADMIN", "MANAGER", "DISPATCH", "FINANCE", "OPERATOR",
  ]);
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const buyer = await prisma.buyer.findUnique({ where: { id } });

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    return NextResponse.json({ buyer });
  } catch (error) {
    console.error("Get buyer failed:", error);
    return NextResponse.json({ error: "Unable to retrieve buyer" }, { status: 500 });
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
    const parsed = buyerUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid buyer data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const buyer = await prisma.buyer.update({
      where: { id },
      data: {
        ...data,
        ...(data.email === "" ? { email: null } : {}),
      },
    });

    return NextResponse.json({ buyer });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    console.error("Update buyer failed:", error);
    return NextResponse.json({ error: "Unable to update buyer" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  const auth = await requireRole(["ADMIN"]);
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const buyer = await prisma.buyer.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    if (buyer._count.orders > 0) {
      return NextResponse.json(
        { error: "Cannot delete a buyer with existing orders" },
        { status: 409 },
      );
    }

    await prisma.buyer.delete({ where: { id } });

    return NextResponse.json({ message: "Buyer deleted successfully" });
  } catch (error) {
    console.error("Delete buyer failed:", error);
    return NextResponse.json({ error: "Unable to delete buyer" }, { status: 500 });
  }
}

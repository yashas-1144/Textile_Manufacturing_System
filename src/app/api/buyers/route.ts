
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";

const buyerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254).optional().nullable()
    .or(z.literal("")),
  phone: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
});

export async function GET() {
  const auth = await requireRole([
    "ADMIN", "MANAGER", "DISPATCH", "FINANCE", "OPERATOR",
  ]);

  if (auth.error) return auth.error;

  try {
    const buyers = await prisma.buyer.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ buyers });
  } catch (error) {
    console.error("List buyers failed:", error);
    return NextResponse.json(
      { error: "Unable to retrieve buyers" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "MANAGER"]);
  if (auth.error) return auth.error;

  try {
    const body: unknown = await request.json();
    const parsed = buyerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid buyer data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const buyer = await prisma.buyer.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      },
    });

    return NextResponse.json({ buyer }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.error("Create buyer failed:", error);
    return NextResponse.json(
      { error: "Unable to create buyer" },
      { status: 500 },
    );
  }
}

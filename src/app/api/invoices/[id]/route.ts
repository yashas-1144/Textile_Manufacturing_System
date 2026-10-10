
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { parsePositiveIntId } from "@/lib/ids";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/invoices/:id
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

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      dispatch: {
        include: {
          order: { include: { buyer: true } },
          items: { include: { roll: true } },
        },
      },
      payments: true,
    },
  });

  if (!invoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ invoice });
}

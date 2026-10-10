
import { NextResponse } from "next/server";
import { Prisma, DispatchStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  status: z.nativeEnum(DispatchStatus).optional(),
  vehicleNo: z.string().trim().max(30).nullable().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "Provide at least one field to update",
});

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireRole(["ADMIN", "MANAGER", "DISPATCH", "FINANCE"]);
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id },
      include: {
        order: true,
        items: { include: { roll: true } },
        invoice: true,
      },
    });

    if (!dispatch) {
      return NextResponse.json({ error: "Dispatch not found" }, { status: 404 });
    }

    return NextResponse.json({ dispatch });
  } catch (error) {
    console.error("Get dispatch failed:", error);
    return NextResponse.json({ error: "Unable to retrieve dispatch" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireRole(["ADMIN", "MANAGER", "DISPATCH"]);
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const body: unknown = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid dispatch update", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const dispatch = await prisma.$transaction(async tx => {
      const existing = await tx.dispatch.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existing) throw new Error("DISPATCH_NOT_FOUND");

      const current = existing.status;
      const next = data.status;

      const allowed: Record<DispatchStatus, DispatchStatus[]> = {
        PENDING: ["PACKED", "CANCELLED"],
        PACKED: ["DISPATCHED", "CANCELLED"],
        DISPATCHED: ["DELIVERED"],
        DELIVERED: [],
        CANCELLED: [],
      };

      if (next && next !== current && !allowed[current].includes(next)) {
        throw new Error("INVALID_TRANSITION");
      }

      if (next === "CANCELLED" && current !== "CANCELLED") {
        if (existing.items.length > 0) {
          for (const item of existing.items) {
            const result = await tx.finishedRoll.updateMany({
              where: {
                id: item.rollId,
                dispatchedQuantity: { gte: item.quantity },
              },
              data: {
                dispatchedQuantity: { decrement: item.quantity },
              },
            });

            if (result.count !== 1) throw new Error("STOCK_ROLLBACK_FAILED");
          }
        }
      }

      return tx.dispatch.update({
        where: { id },
        data: {
          ...(next !== undefined && { status: next }),
          ...(data.vehicleNo !== undefined && { vehicleNo: data.vehicleNo }),
          ...(next === "DISPATCHED" && { dispatchedAt: new Date() }),
          ...(next === "DELIVERED" && { deliveredAt: new Date() }),
        },
        include: { items: { include: { roll: true } }, order: true },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json({ dispatch });
  } catch (error) {
    if (error instanceof Error && error.message === "DISPATCH_NOT_FOUND") {
      return NextResponse.json({ error: "Dispatch not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "INVALID_TRANSITION") {
      return NextResponse.json({ error: "Invalid dispatch status transition" }, { status: 409 });
    }

    if (error instanceof Error && error.message === "STOCK_ROLLBACK_FAILED") {
      return NextResponse.json({ error: "Unable to safely restore roll quantities" }, { status: 409 });
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return NextResponse.json({ error: "Concurrent update; retry the request" }, { status: 409 });
    }

    console.error("Update dispatch failed:", error);
    return NextResponse.json({ error: "Unable to update dispatch" }, { status: 500 });
  }
}

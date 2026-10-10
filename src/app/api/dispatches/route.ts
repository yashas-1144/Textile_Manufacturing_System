
import { NextResponse } from "next/server";
import { Prisma, DispatchStatus, QualityStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { positiveIdSchema } from "@/lib/ids";

export const runtime = "nodejs";

const createDispatchSchema = z.object({
  dispatchNo: z.string().trim().min(1).max(60),
  orderId: positiveIdSchema,
  vehicleNo: z.string().trim().max(30).optional().nullable(),
  items: z
    .array(
      z.object({
        rollId: positiveIdSchema,
        quantity: z.coerce.number().positive().finite(),
      }),
    )
    .min(1)
    .refine(
      items => new Set(items.map(item => item.rollId)).size === items.length,
      "Each roll may appear only once per dispatch",
    ),
});

export async function GET() {
  const auth = await requireRole([
    "ADMIN",
    "MANAGER",
    "DISPATCH",
    "FINANCE",
  ]);
  if (auth.error) return auth.error;

  try {
    const dispatches = await prisma.dispatch.findMany({
      include: {
        order: { select: { id: true, orderNumber: true } },
        items: { include: { roll: true } },
        invoice: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ dispatches });
  } catch (error) {
    console.error("List dispatches failed:", error);
    return NextResponse.json(
      { error: "Unable to retrieve dispatches" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "MANAGER", "DISPATCH"]);
  if (auth.error) return auth.error;

  try {
    const body: unknown = await request.json();
    const parsed = createDispatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid dispatch data",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const dispatch = await prisma.$transaction(
      async tx => {
        const order = await tx.order.findUnique({
          where: { id: data.orderId },
          select: { id: true, quantity: true, status: true },
        });

        if (!order) throw new Error("ORDER_NOT_FOUND");
        if (order.status === "CANCELLED") {
          throw new Error("ORDER_CANCELLED");
        }

        const rollIds = data.items.map(item => item.rollId);

        const rolls = await tx.finishedRoll.findMany({
          where: { id: { in: rollIds } },
        });

        if (rolls.length !== rollIds.length) {
          throw new Error("ROLL_NOT_FOUND");
        }

        for (const item of data.items) {
          const roll = rolls.find(r => r.id === item.rollId)!;

          if (roll.orderId !== data.orderId) {
            throw new Error("ROLL_ORDER_MISMATCH");
          }

          if (roll.qualityStatus !== QualityStatus.PASSED) {
            throw new Error("ROLL_NOT_PASSED");
          }

          const available = new Prisma.Decimal(roll.quantity).minus(
            roll.dispatchedQuantity,
          );
          const requested = new Prisma.Decimal(item.quantity);

          if (requested.greaterThan(available)) {
            throw new Error("INSUFFICIENT_STOCK");
          }

          // Atomically reserve roll quantity to prevent overselling.
          const updated = await tx.finishedRoll.updateMany({
            where: {
              id: roll.id,
              qualityStatus: QualityStatus.PASSED,
              dispatchedQuantity: {
                lte: new Prisma.Decimal(roll.quantity).minus(requested),
              },
            },
            data: {
              dispatchedQuantity: { increment: requested },
            },
          });

          if (updated.count !== 1) {
            throw new Error("INSUFFICIENT_STOCK");
          }
        }

        const createdDispatch = await tx.dispatch.create({
          data: {
            dispatchNo: data.dispatchNo,
            orderId: data.orderId,
            vehicleNo: data.vehicleNo || null,
            items: {
              create: data.items.map(item => ({
                rollId: item.rollId,
                quantity: new Prisma.Decimal(item.quantity),
              })),
            },
          },
          include: {
            items: { include: { roll: true } },
            order: true,
          },
        });

        // Include this new dispatch, but exclude cancelled dispatches.
        const dispatchedItems = await tx.dispatchItem.findMany({
          where: {
            dispatch: {
              orderId: data.orderId,
              status: { not: DispatchStatus.CANCELLED },
            },
          },
          select: { quantity: true },
        });

        const totalDispatched = dispatchedItems.reduce(
          (sum, item) => sum.plus(item.quantity),
          new Prisma.Decimal(0),
        );

        const orderQuantity = new Prisma.Decimal(order.quantity);

        // Update only orders already approved for dispatch.
        if (
          order.status === "READY" ||
          order.status === "PARTIALLY_DISPATCHED" ||
          order.status === "DISPATCHED"
        ) {
          const nextStatus = totalDispatched.greaterThanOrEqualTo(
            orderQuantity,
          )
            ? "DISPATCHED"
            : "PARTIALLY_DISPATCHED";

          await tx.order.update({
            where: { id: data.orderId },
            data: { status: nextStatus },
          });
        }

        return createdDispatch;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return NextResponse.json({ dispatch }, { status: 201 });
  } catch (error) {
    const messages: Record<
      string,
      { status: number; message: string }
    > = {
      ORDER_NOT_FOUND: {
        status: 404,
        message: "Order not found",
      },
      ORDER_CANCELLED: {
        status: 409,
        message: "Cannot dispatch a cancelled order",
      },
      ROLL_NOT_FOUND: {
        status: 404,
        message: "One or more rolls were not found",
      },
      ROLL_ORDER_MISMATCH: {
        status: 400,
        message: "Every roll must belong to the selected order",
      },
      ROLL_NOT_PASSED: {
        status: 409,
        message: "Only quality-approved rolls can be dispatched",
      },
      INSUFFICIENT_STOCK: {
        status: 409,
        message: "Requested quantity exceeds available stock",
      },
    };

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 },
      );
    }

    if (error instanceof Error && messages[error.message]) {
      const result = messages[error.message];
      return NextResponse.json(
        { error: result.message },
        { status: result.status },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Dispatch number already exists" },
          { status: 409 },
        );
      }

      if (error.code === "P2034") {
        return NextResponse.json(
          { error: "Concurrent update; retry the request" },
          { status: 409 },
        );
      }
    }

    console.error("Create dispatch failed:", error);

    return NextResponse.json(
      { error: "Unable to create dispatch" },
      { status: 500 },
    );
  }
}

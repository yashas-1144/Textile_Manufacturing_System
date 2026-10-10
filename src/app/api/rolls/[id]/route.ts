
import { NextResponse } from "next/server";
import { Prisma, QualityStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateRollSchema = z.object({
  machineCode: z.string().trim().max(60).nullable().optional(),
  qualityStatus: z.nativeEnum(QualityStatus).optional(),
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
    const roll = await prisma.finishedRoll.findUnique({
      where: { id },
      include: {
        order: {
          select: { id: true, orderNumber: true, fabricType: true, colour: true },
        },
        dispatchItems: {
          include: {
            dispatch: {
              select: { id: true, dispatchNo: true, status: true },
            },
          },
        },
      },
    });

    if (!roll) {
      return NextResponse.json({ error: "Finished roll not found" }, { status: 404 });
    }

    return NextResponse.json({ roll });
  } catch (error) {
    console.error("Get roll failed:", error);
    return NextResponse.json(
      { error: "Unable to retrieve finished roll" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  const auth = await requireRole(["ADMIN", "MANAGER", "OPERATOR"]);
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const body: unknown = await request.json();
    const parsed = updateRollSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid roll update", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const existing = await prisma.finishedRoll.findUnique({
      where: { id },
      select: { id: true, dispatchedQuantity: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Finished roll not found" }, { status: 404 });
    }

    if (data.qualityStatus === "PASSED") {
      const dispatched = Number(existing.dispatchedQuantity);

      if (dispatched > 0) {
        return NextResponse.json(
          { error: "Cannot change quality status to PASSED after dispatch has begun" },
          { status: 409 },
        );
      }
    }

    const roll = await prisma.finishedRoll.update({
      where: { id },
      data: {
        ...(data.machineCode !== undefined && {
          machineCode: data.machineCode,
        }),
        ...(data.qualityStatus !== undefined && {
          qualityStatus: data.qualityStatus,
        }),
      },
    });

    return NextResponse.json({ roll });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Finished roll not found" }, { status: 404 });
    }

    console.error("Update roll failed:", error);
    return NextResponse.json(
      { error: "Unable to update finished roll" },
      { status: 500 },
    );
  }
}

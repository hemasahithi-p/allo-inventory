export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const reservation = await prisma.reservation.findUnique({ where: { id } });

  if (!reservation)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (reservation.status !== "PENDING" || reservation.expiresAt < new Date()) {
    if (reservation.status === "PENDING") {
      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({ where: { id }, data: { status: "RELEASED" } });
        await tx.stockLevel.update({
          where: { productId_warehouseId: { productId: reservation.productId, warehouseId: reservation.warehouseId } },
          data: { reservedUnits: { decrement: reservation.quantity } },
        });
      });
    }
    return NextResponse.json({ error: "Reservation expired" }, { status: 410 });
  }

  const updated = await prisma.reservation.update({ where: { id }, data: { status: "CONFIRMED" } });
  return NextResponse.json(updated);
}
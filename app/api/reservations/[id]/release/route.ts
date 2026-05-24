export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const reservation = await prisma.reservation.findUnique({ where: { id } });

  if (!reservation || reservation.status !== "PENDING")
    return NextResponse.json({ error: "Cannot release this reservation" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({ where: { id }, data: { status: "RELEASED" } });
    await tx.stockLevel.update({
      where: { productId_warehouseId: { productId: reservation.productId, warehouseId: reservation.warehouseId } },
      data: { reservedUnits: { decrement: reservation.quantity } },
    });
  });

  return NextResponse.json({ success: true });
}
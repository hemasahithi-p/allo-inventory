export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  quantity: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { productId, warehouseId, quantity } = parsed.data;
  const lockKey = `lock:${productId}:${warehouseId}`;

  const acquired = await redis.set(lockKey, "1", {
    nx: true,
    ex: 10,
  });

  if (!acquired)
    return NextResponse.json(
      { error: "Another reservation in progress, try again" },
      { status: 409 }
    );

  try {
    const stock = await prisma.stockLevel.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });

    if (!stock || stock.totalUnits - stock.reservedUnits < quantity)
      return NextResponse.json({ error: "Not enough stock" }, { status: 409 });

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const reservation = await prisma.$transaction(async (tx) => {
      const r = await tx.reservation.create({
        data: { productId, warehouseId, quantity, expiresAt },
      });
      await tx.stockLevel.update({
        where: { productId_warehouseId: { productId, warehouseId } },
        data: { reservedUnits: { increment: quantity } },
      });
      return r;
    });

    return NextResponse.json(reservation, { status: 201 });
  } finally {
    await redis.del(lockKey);
  }
}
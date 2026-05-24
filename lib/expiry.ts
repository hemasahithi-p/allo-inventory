export const dynamic = "force-dynamic";

import { prisma } from "./prisma";

export async function releaseExpiredReservations() {
  const expired = await prisma.reservation.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
  });

  for (const r of expired) {
    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: r.id },
        data: { status: "RELEASED" },
      });
      await tx.stockLevel.update({
        where: {
          productId_warehouseId: {
            productId: r.productId,
            warehouseId: r.warehouseId,
          },
        },
        data: { reservedUnits: { decrement: r.quantity } },
      });
    });
  }
}
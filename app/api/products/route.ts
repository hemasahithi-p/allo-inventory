export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/expiry";
import { NextResponse } from "next/server";

export async function GET() {
  await releaseExpiredReservations();

  const products = await prisma.product.findMany({
    include: {
      stockLevels: {
        include: { warehouse: true },
      },
    },
  });

  const result = products.map((p) => ({
    ...p,
    stockLevels: p.stockLevels.map((sl) => ({
      ...sl,
      availableUnits: sl.totalUnits - sl.reservedUnits,
    })),
  }));

  return NextResponse.json(result);
}
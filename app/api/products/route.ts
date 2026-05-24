export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import prisma from "@/lib/safe-prisma";
import { NextResponse } from "next/server";

export async function GET() {
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
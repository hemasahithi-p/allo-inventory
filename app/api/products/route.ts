export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/expiry";
import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    await releaseExpiredReservations();
  }

  const products = await prisma.product.findMany({
    include: {
      stockLevels: {
        include: { warehouse: true },
      },
    },
  });

  return NextResponse.json(products);
}
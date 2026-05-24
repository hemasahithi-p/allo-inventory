import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const w1 = await prisma.warehouse.create({
    data: { name: "Mumbai Central", location: "Mumbai, IN" },
  });
  const w2 = await prisma.warehouse.create({
    data: { name: "Delhi North", location: "Delhi, IN" },
  });

  const p1 = await prisma.product.create({
    data: { name: "Wireless Headphones", description: "Over-ear noise cancelling" },
  });
  const p2 = await prisma.product.create({
    data: { name: "Mechanical Keyboard", description: "TKL, Cherry MX Blue" },
  });

  await prisma.stockLevel.createMany({
    data: [
      { productId: p1.id, warehouseId: w1.id, totalUnits: 10 },
      { productId: p1.id, warehouseId: w2.id, totalUnits: 5 },
      { productId: p2.id, warehouseId: w1.id, totalUnits: 3 },
      { productId: p2.id, warehouseId: w2.id, totalUnits: 8 },
    ],
  });

  console.log("Seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
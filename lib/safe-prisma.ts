import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  const globalForPrisma = globalThis as any;
  prisma = globalForPrisma.prisma || new PrismaClient();
  globalForPrisma.prisma = prisma;
}

export default prisma;
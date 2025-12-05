// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

const connectionString = process.env.DATABASE_URL!;
(globalThis as any).neonConfig = (globalThis as any).neonConfig || {};
(globalThis as any).neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

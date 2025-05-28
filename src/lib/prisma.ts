// This setup ensures that you only create one Prisma Client instance during development and prevents issues with serverless functions.

import { PrismaClient } from '@prisma/client';

// Extend the globalThis interface to include a prisma property
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'], // Optional: helpful during development
  });

// Cache the PrismaClient instance in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
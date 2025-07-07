// This setup ensures that you only create one Prisma Client instance during development and prevents issues with serverless functions.

import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate'

let options = {};
if (process.env.NODE_ENV !== 'production') {
  options = {
    log: ['query', 'info', 'warn', 'error'], // Optional: helpful during development
  };
}

const basePrisma = new PrismaClient(options);
const extendedPrisma = basePrisma.$extends(withAccelerate());
type ExtendedPrismaClient = typeof extendedPrisma;

// Extend the globalThis interface to include a prisma property
const globalForPrisma: {
  prisma: ExtendedPrismaClient | undefined;
} = globalThis as never;

// Cache the PrismaClient instance in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = extendedPrisma;
}

export const prisma = globalForPrisma.prisma ?? extendedPrisma;
export default prisma;
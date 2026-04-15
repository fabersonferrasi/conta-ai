import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  prismaAdapter?: PrismaBetterSqlite3;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não está definida.');
}

const prismaAdapter =
  globalForPrisma.prismaAdapter ||
  new PrismaBetterSqlite3({ url: connectionString });

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: prismaAdapter,
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaAdapter = prismaAdapter;
}

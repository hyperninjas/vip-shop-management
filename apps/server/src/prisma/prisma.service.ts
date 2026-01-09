import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { Pool, PoolConfig } from 'pg';
import { PrismaClient } from '../generated/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    const poolConfig: PoolConfig = {
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DATABASE_POOL_MAX || '20', 10), // Maximum pool size
      min: parseInt(process.env.DATABASE_POOL_MIN || '5', 10), // Minimum pool size
      idleTimeoutMillis: parseInt(
        process.env.DATABASE_POOL_IDLE_TIMEOUT || '30000',
        10,
      ),
      connectionTimeoutMillis: parseInt(
        process.env.DATABASE_POOL_CONNECTION_TIMEOUT || '2000',
        10,
      ),
      // Connection pool optimization
      allowExitOnIdle: false,
    };

    // Create pool before calling super() (can't use 'this' before super)
    const pool = new Pool(poolConfig);
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });

    // Now we can assign to this.pool after super() is called
    this.pool = pool;

    // Handle pool errors
    this.pool.on('error', (err: Error) => {
      this.logger.error('Unexpected error on idle database client', err.stack);
    });

    // Handle pool connection events
    this.pool.on('connect', () => {
      this.logger.debug('New database connection established');
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connection established successfully');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to connect to database: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      await this.pool.end();
      this.logger.log('Database connection closed');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error closing database connection: ${errorMessage}`,
        errorStack,
      );
    }
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      await this.$executeRawUnsafe('SELECT 1');
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Database health check failed: ${errorMessage}`,
        errorStack,
      );
      return false;
    }
  }
}

const prisma = new PrismaService();
export default prisma;

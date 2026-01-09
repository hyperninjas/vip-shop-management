import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckError,
  HealthCheckService,
  HealthIndicatorResult,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @AllowAnonymous()
  @HealthCheck()
  async check() {
    return this.health.check([
      () => this.checkDatabase(),
      () => this.checkMemory(),
      () => this.checkDisk(),
    ]);
  }

  @Get('liveness')
  @AllowAnonymous()
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('readiness')
  @AllowAnonymous()
  @HealthCheck()
  async readiness() {
    return this.health.check([() => this.checkDatabase()]);
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      const isHealthy = await this.prisma.isHealthy();
      const responseTime = Date.now() - startTime;

      if (!isHealthy) {
        throw new Error('Database health check returned false');
      }

      return {
        database: {
          status: 'up',
          responseTime: `${responseTime}ms`,
        },
      };
    } catch (error: unknown) {
      const errorInstance =
        error instanceof Error ? error : new Error(String(error));
      throw new HealthCheckError('Database check failed', errorInstance);
    }
  }

  private async checkMemory(): Promise<HealthIndicatorResult> {
    // Check if memory usage is below 1.5GB
    return this.memory.checkHeap('memory_heap', 1500 * 1024 * 1024);
  }

  private async checkDisk(): Promise<HealthIndicatorResult> {
    // Check if disk usage is below 90%
    return this.disk.checkStorage('storage', {
      path: '/',
      thresholdPercent: 0.9,
    });
  }
}

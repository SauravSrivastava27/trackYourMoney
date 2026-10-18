import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './database.module.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get('db')
  async database() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'disconnected' });
    }
  }
}
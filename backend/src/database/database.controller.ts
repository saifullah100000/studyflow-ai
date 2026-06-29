import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async getDatabaseHealth() {
    await this.prisma.$queryRaw`SELECT 1`;

    const [users, notes, generationJobs] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.note.count(),
      this.prisma.generationJob.count(),
    ]);

    return {
      status: 'connected',
      database: 'studyflow_db',
      counts: {
        users,
        notes,
        generationJobs,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

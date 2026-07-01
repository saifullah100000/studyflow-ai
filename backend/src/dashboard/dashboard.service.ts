import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardStats {
  totalNotes: number;
  completedGenerations: number;
  failedGenerations: number;
  whatsappDeliveries: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string): Promise<DashboardStats> {
    const [
      totalNotes,
      completedGenerations,
      failedGenerations,
      whatsappDeliveries,
    ] = await Promise.all([
      this.prisma.note.count({
        where: {
          userId,
        },
      }),

      this.prisma.generationJob.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      }),

      this.prisma.generationJob.count({
        where: {
          userId,
          status: 'FAILED',
        },
      }),

      this.prisma.generationJob.count({
        where: {
          userId,
          whatsappDelivered: true,
        },
      }),
    ]);

    return {
      totalNotes,
      completedGenerations,
      failedGenerations,
      whatsappDeliveries,
    };
  }
}

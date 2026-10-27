import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VisitorsService {
  constructor(private readonly db: PrismaService) {}

  async ping(id: string, path: string) {
    const now = new Date();
    const previous = await this.db.visitor.findUnique({ where: { id } });
    if (!previous) {
      await this.db.visitor.create({
        data: {
          id, firstSeen: now, lastSeen: now, lastPath: path, visitCount: 1,
          visits: { create: { startedAt: now, lastSeen: now, path } },
        },
      });
      return;
    }
    const newVisit = now.getTime() - previous.lastSeen.getTime() >= 30 * 60 * 1000;
    await this.db.visitor.update({
      where: { id },
      data: {
        lastSeen: now, lastPath: path,
        ...(newVisit ? {
          visitCount: { increment: 1 },
          visits: { create: { startedAt: now, lastSeen: now, path } },
        } : {}),
      },
    });
    if (!newVisit) {
      const visit = await this.db.visitorVisit.findFirst({
        where: { visitorId: id }, orderBy: { startedAt: 'desc' },
        select: { id: true },
      });
      if (visit) {
        await this.db.visitorVisit.update({
          where: { id: visit.id }, data: { lastSeen: now, path },
        });
      }
    }
  }

  async dashboard() {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const onlineSince = new Date(now.getTime() - 5 * 60 * 1000);
    const [total, online, newToday, returning, visitors] = await Promise.all([
      this.db.visitor.count(),
      this.db.visitor.count({ where: { lastSeen: { gte: onlineSince } } }),
      this.db.visitor.count({ where: { firstSeen: { gte: today } } }),
      this.db.visitor.count({ where: { visitCount: { gt: 1 } } }),
      this.db.visitor.findMany({
        orderBy: { lastSeen: 'desc' },
        take: 100,
        select: {
          id: true, firstSeen: true, lastSeen: true, lastPath: true, visitCount: true,
          visits: {
            orderBy: { startedAt: 'desc' }, take: 10,
            select: { id: true, startedAt: true, lastSeen: true, path: true },
          },
        },
      }),
    ]);
    return { total, online, newToday, returning, onlineWindowMinutes: 5, visitors };
  }
}

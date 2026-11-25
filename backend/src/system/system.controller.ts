import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { readFile, statfs } from 'node:fs/promises';
import { cpus, loadavg } from 'node:os';
import { TelegramAdminGuard } from '../auth/telegram-admin.guard';
import { PrismaService } from '../prisma/prisma.service';

async function meminfo() {
  try {
    const text = await readFile('/proc/meminfo', 'utf8');
    const read = (name: string) => Number(text.match(new RegExp('^' + name + ':\\s+(\\d+)', 'm'))?.[1] ?? 0) * 1024;
    const total = read('MemTotal'), available = read('MemAvailable');
    return total ? { total, used: total - available, available } : null;
  } catch { return null; }
}

async function procUptime() {
  try {
    const value = Number((await readFile('/proc/uptime', 'utf8')).split(' ')[0]);
    return Number.isFinite(value) ? Math.floor(value) : null;
  } catch { return null; }
}

async function cgroupCpu() {
  try {
    const value = await readFile('/sys/fs/cgroup/cpu.stat', 'utf8');
    const microseconds = Number(value.match(/^usage_usec (\d+)$/m)?.[1]);
    return Number.isFinite(microseconds) ? microseconds : null;
  } catch { return null; }
}

@Controller('system')
@UseGuards(TelegramAdminGuard)
export class SystemController {
  private lastCpu: { usage: number; time: number } | null = null;
  constructor(private readonly prisma: PrismaService) {}

  @Get('status')
  @Header('Cache-Control', 'private, no-store')
  async status() {
    const [disk, memory, hostUptime, usage, database] = await Promise.all([
      statfs('/').then((s) => ({
        total: s.blocks * s.bsize,
        used: (s.blocks - s.bfree) * s.bsize,
        available: s.bavail * s.bsize,
      })).catch(() => null),
      meminfo(),
      procUptime(),
      cgroupCpu(),
      this.prisma.$queryRaw`SELECT 1`.then(() => 'online').catch(() => 'offline'),
    ]);
    const timestamp = Date.now();
    let percent: number | null = null;
    if (usage !== null && this.lastCpu) {
      const elapsedUs = (timestamp - this.lastCpu.time) * 1000;
      if (elapsedUs > 0) percent = Math.min(100, Math.max(0, Math.round((usage - this.lastCpu.usage) / elapsedUs * 100)));
    }
    this.lastCpu = usage === null ? null : { usage, time: timestamp };
    return {
      timestamp: new Date(timestamp).toISOString(),
      backend: 'online',
      database,
      cpu: { percent, cores: cpus().length, load1m: loadavg()[0], scope: 'backend-container' },
      memory: memory ? { ...memory, scope: 'vm-memory' } : null,
      disk: disk ? { ...disk, scope: 'container-root' } : null,
      uptimeSeconds: hostUptime,
    };
  }
}

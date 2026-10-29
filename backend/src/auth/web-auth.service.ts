import {
  ConflictException,
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { createHmac, randomInt } from 'node:crypto';
import { MailService } from './mail.service';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class WebAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
  ) {}

  private digest(email: string, purpose: string, code: string) {
    return createHmac('sha256', process.env.JWT_SECRET || 'local-development-secret-change-me')
      .update(`${email}:${purpose}:${code}`).digest('hex');
  }

  private async issue(email: string, purpose: string, passwordHash?: string, name?: string) {
    const code = String(randomInt(100000, 1000000));
    const codeHash = this.digest(email, purpose, code);
    const now = new Date();
    // Atomic cooldown: concurrent requests cannot keep rotating the code.
    await this.prisma.$transaction(async tx => {
      await tx.emailChallenge.upsert({ where: { email_purpose: { email, purpose } },
        create: { email, purpose, codeHash: '', expiresAt: new Date(0), sentAt: new Date(0) }, update: {} });
      const reserved = await tx.emailChallenge.updateMany({ where: { email, purpose, sentAt: { lt: new Date(now.getTime() - 60000) } },
        data: { codeHash, expiresAt: new Date(now.getTime() + 600000), sentAt: now, attempts: 0,
          passwordHash: passwordHash ?? null, name: name ?? null } });
      if (!reserved.count) throw new BadRequestException('Новый код можно запросить через минуту');
    });
    try { await this.mail.sendCode(email, code, purpose); }
    catch (e) {
      await this.prisma.emailChallenge.deleteMany({ where: { email, purpose, codeHash } });
      throw e;
    }
    return { sent: true };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } }))
      throw new ConflictException('Этот email уже зарегистрирован. Войдите или восстановите пароль.');
    return this.issue(email, 'register', await bcrypt.hash(dto.password, 12), dto.name?.trim());
  }

  private async consume(email: string, purpose: string, code: string, passwordHash?: string) {
    // Attempt counter commits even for an invalid code.
    const attempt = await this.prisma.emailChallenge.updateMany({
      where: { email, purpose, expiresAt: { gt: new Date() }, attempts: { lt: 5 } },
      data: { attempts: { increment: 1 } } });
    if (!attempt.count) throw new BadRequestException('Код истёк или попытки закончились. Запросите новый.');
    const codeHash = this.digest(email, purpose, code);
    return this.prisma.$transaction(async tx => {
      const challenge = await tx.emailChallenge.findUnique({ where: { email_purpose: { email, purpose } } });
      if (!challenge || challenge.codeHash !== codeHash) throw new BadRequestException('Неверный код');
      const consumed = await tx.emailChallenge.deleteMany({ where: { email, purpose, codeHash, expiresAt: { gt: new Date() } } });
      if (!consumed.count) throw new BadRequestException('Код уже использован или истёк');
      if (purpose === 'register') {
        if (await tx.user.findUnique({ where: { email } })) throw new ConflictException('Аккаунт уже существует');
        return tx.user.create({ data: { email, name: challenge.name, passwordHash: challenge.passwordHash, emailVerifiedAt: new Date() } });
      }
      return tx.user.update({ where: { email }, data: { passwordHash, emailVerifiedAt: new Date(), sessionVersion: { increment: 1 } } });
    });
  }

  async verifyRegistration(email: string, code: string) {
    return this.createAuthResponse(await this.consume(email.trim().toLowerCase(), 'register', code));
  }

  async forgotPassword(rawEmail: string) {
    const email = rawEmail.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user?.passwordHash) await this.issue(email, 'reset');
    return { sent: true };
  }

  async resetPassword(email: string, code: string, password: string) {
    await this.consume(email.trim().toLowerCase(), 'reset', code, await bcrypt.hash(password, 12));
    return { ok: true };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException(
        'Неверный email или пароль',
      );
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Неверный email или пароль',
      );
    }

    return this.createAuthResponse(user);
  }

  async getUserFromToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        version?: number;
      }>(token);

      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
      });

      if (!user || (payload.version ?? 0) !== user.sessionVersion) {
        throw new UnauthorizedException(
          'Пользователь не найден',
        );
      }

      return {
        id: user.id,
        telegramId: user.telegramId,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      };
    } catch {
      throw new UnauthorizedException(
        'Недействительная сессия',
      );
    }
  }

  private async createAuthResponse(user: {
    id: string;
    telegramId: string | null;
    email: string | null;
    name: string | null;
    phone: string | null;
    role: string;
    sessionVersion: number;
  }) {
    const accessToken =
      await this.jwtService.signAsync({
        sub: user.id,
        version: user.sessionVersion,
      });

    return {
      accessToken,

      user: {
        id: user.id,
        telegramId: user.telegramId,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}
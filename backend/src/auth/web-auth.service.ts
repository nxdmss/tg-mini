import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

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
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'Пользователь с таким email уже существует',
      );
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      12,
    );

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name?.trim() || null,
      },
    });

    return this.createAuthResponse(user);
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
      }>(token);

      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
      });

      if (!user) {
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
  }) {
    const accessToken =
      await this.jwtService.signAsync({
        sub: user.id,
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
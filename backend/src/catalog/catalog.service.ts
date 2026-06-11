import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async brands() {
    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async createBrand(name: string) {
    try {
      return await this.prisma.brand.create({
        data: { name: name.trim() },
        include: { _count: { select: { products: true } } },
      });
    } catch (error) {
      this.handleCreateError(error, 'Brand');
    }
  }

  async categories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async createCategory(name: string) {
    try {
      return await this.prisma.category.create({
        data: { name: name.trim() },
        include: { _count: { select: { products: true } } },
      });
    } catch (error) {
      this.handleCreateError(error, 'Category');
    }
  }

  private handleCreateError(error: unknown, label: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new BadRequestException(`${label} already exists`);
    }

    throw error;
  }
}

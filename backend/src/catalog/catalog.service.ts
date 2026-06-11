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

  async deleteBrand(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!brand) {
      throw new BadRequestException('Brand not found');
    }

    if (brand._count.products > 0) {
      throw new BadRequestException('Brand has products and cannot be deleted');
    }

    await this.prisma.brand.delete({ where: { id } });
    return { ok: true };
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

  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    if (category._count.products > 0) {
      throw new BadRequestException('Category has products and cannot be deleted');
    }

    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  private handleCreateError(error: unknown, label: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new BadRequestException(`${label} already exists`);
    }

    throw error;
  }
}

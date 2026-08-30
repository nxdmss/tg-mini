import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopDto } from './create-shop.dto';
import { UpdateShopDto } from './update-shop.dto';

const shopSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
  bannerUrl: true,
  backgroundColor: true,
  textColor: true,
  accentColor: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      products: {
        where: {
          deletedAt: null,
        },
      },
    },
  },
} satisfies Prisma.ShopSelect;

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function emptyToNull(value?: string) {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || null;
}

function mapShop<T extends { _count: { products: number } }>(
  shop: T,
) {
  const { _count, ...shopData } = shop;

  return {
    ...shopData,
    productCount: _count.products,
  };
}

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const shops = await this.prisma.shop.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
      select: shopSelect,
    });

    return shops.map(mapShop);
  }

  async findAllAdmin() {
    const shops = await this.prisma.shop.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [
        {
          isActive: 'desc',
        },
        {
          name: 'asc',
        },
      ],
      select: shopSelect,
    });

    return shops.map(mapShop);
  }

  async findOne(slug: string) {
    const normalizedSlug = normalizeSlug(slug);

    const shop = await this.prisma.shop.findFirst({
      where: {
        slug: normalizedSlug,
        isActive: true,
        deletedAt: null,
      },
      select: shopSelect,
    });

    if (!shop) {
      throw new NotFoundException(
        `Shop ${normalizedSlug} not found`,
      );
    }

    return mapShop(shop);
  }

  async create(body: CreateShopDto) {
    const slug = normalizeSlug(body.slug);

    if (!slug) {
      throw new BadRequestException(
        'Slug must contain latin letters, numbers or hyphens',
      );
    }

    try {
      const shop = await this.prisma.shop.create({
        data: {
          name: body.name.trim(),
          slug,
          description: emptyToNull(body.description),
          logoUrl: emptyToNull(body.logoUrl),
          bannerUrl: emptyToNull(body.bannerUrl),
          backgroundColor:
            body.backgroundColor ?? '#ffffff',
          textColor:
            body.textColor ?? '#000000',
          accentColor:
            body.accentColor ?? '#000000',
          isActive:
            body.isActive ?? true,
        },
        select: shopSelect,
      });

      return mapShop(shop);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Shop slug "${slug}" already exists`,
        );
      }

      throw error;
    }
  }

  async update(
    id: string,
    body: UpdateShopDto,
  ) {
    const existing = await this.prisma.shop.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Shop not found');
    }

    const slug =
      body.slug === undefined
        ? undefined
        : normalizeSlug(body.slug);

    if (body.slug !== undefined && !slug) {
      throw new BadRequestException(
        'Slug must contain latin letters, numbers or hyphens',
      );
    }

    try {
      const shop = await this.prisma.shop.update({
        where: {
          id,
        },
        data: {
          name:
            body.name === undefined
              ? undefined
              : body.name.trim(),
          slug,
          description: emptyToNull(body.description),
          logoUrl: emptyToNull(body.logoUrl),
          bannerUrl: emptyToNull(body.bannerUrl),
          backgroundColor: body.backgroundColor,
          textColor: body.textColor,
          accentColor: body.accentColor,
          isActive: body.isActive,
        },
        select: shopSelect,
      });

      return mapShop(shop);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Shop slug "${slug}" already exists`,
        );
      }

      throw error;
    }
  }
}

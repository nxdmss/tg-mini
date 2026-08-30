import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopDto } from './create-shop.dto';
import { UpdateShopDto } from './update-shop.dto';

type ShopImageFiles = {
  logo?: any[];
  banner?: any[];
};

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
        { isActive: 'desc' },
        { name: 'asc' },
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

  async create(
    body: CreateShopDto,
    files: ShopImageFiles = {},
  ) {
    const slug = normalizeSlug(body.slug);

    if (!slug) {
      throw new BadRequestException(
        'Slug must contain latin letters, numbers or hyphens',
      );
    }

    const [logoUrl, bannerUrl] = await Promise.all([
      this.uploadImage(files.logo?.[0], 'logos'),
      this.uploadImage(files.banner?.[0], 'banners'),
    ]);

    try {
      const shop = await this.prisma.shop.create({
        data: {
          name: body.name.trim(),
          slug,
          description: emptyToNull(body.description),
          logoUrl: logoUrl ?? null,
          bannerUrl: bannerUrl ?? null,
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
    files: ShopImageFiles = {},
  ) {
    const existing = await this.prisma.shop.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        logoUrl: true,
        bannerUrl: true,
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

    const [newLogoUrl, newBannerUrl] = await Promise.all([
      this.uploadImage(files.logo?.[0], 'logos'),
      this.uploadImage(files.banner?.[0], 'banners'),
    ]);

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
          logoUrl: newLogoUrl ?? undefined,
          bannerUrl: newBannerUrl ?? undefined,
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

  private async uploadImage(
    file: any | undefined,
    folder: 'logos' | 'banners',
  ): Promise<string | undefined> {
    if (!file) {
      return undefined;
    }

    if (
      typeof file.mimetype === 'string' &&
      !file.mimetype.startsWith('image/')
    ) {
      throw new BadRequestException(
        'Можно загружать только изображения',
      );
    }

    const maxBytes = 8 * 1024 * 1024;

    if (file.size && file.size > maxBytes) {
      throw new BadRequestException(
        'Изображение слишком большое. Максимум 8 МБ',
      );
    }

    this.configureImageStorage();

    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${
            process.env.CLOUDINARY_FOLDER || 'zov'
          }/shops/${folder}`,
          resource_type: 'image',
          quality: 'auto:good',
          fetch_format: 'auto',
        },
        (
          error,
          result?: UploadApiResponse,
        ) => {
          if (error || !result) {
            reject(
              new InternalServerErrorException(
                'Не удалось сохранить изображение',
              ),
            );
            return;
          }

          resolve(result.secure_url);
        },
      );

      stream.end(file.buffer);
    });
  }

  private configureImageStorage() {
    if (process.env.CLOUDINARY_URL) {
      return;
    }

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey =
      process.env.CLOUDINARY_API_KEY;
    const apiSecret =
      process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Хранилище изображений не настроено',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }
}

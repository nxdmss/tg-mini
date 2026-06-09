import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './create-product.dto';
import { QueryProductsDto } from './query-products.dto';
import * as fs from 'fs';
import * as path from 'path';

const productInclude = {
  images: true,
  sizes: true,
  brand: true,
  category: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads'); // Папка для картинок в корне проекта

  constructor(private prisma: PrismaService) {
    // Автоматически создаем папку 'uploads', если её ещё нет на компьютере
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

// === НАЙДИ МЕТОД findAll В products.service.ts И ЗАМЕНИ НА ЭТОТ ===
async findAll(query: QueryProductsDto = {}) {
  const where: Prisma.ProductWhereInput = {};

  if (query.category) where.category = { name: { equals: query.category, mode: 'insensitive' } };
  if (query.brand) where.brand = { name: { equals: query.brand, mode: 'insensitive' } };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.inStock !== undefined) where.inStock = query.inStock;

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
  if (query.sort === 'price_asc') orderBy = { price: 'asc' };
  else if (query.sort === 'price_desc') orderBy = { price: 'desc' };

  // 1. Берем продукты из твоей локальной базы
  const products = await this.prisma.product.findMany({ where, orderBy, include: productInclude });

  // 2. Берем живую ссылку ngrok из файла .env
  const appUrl = process.env.BACKEND_URL || 'http://localhost:3000';

  // 3. Формируем ответ: размеры оставляем объектами, а к картинкам клеим ссылку ngrok
  return products.map((product) => ({
    ...product,
    sizes: product.sizes, // Фронтенд видит правильные объекты и не ломается
    images: product.images.map((img) => {
      // Чистим путь от старых localhost, если они записались в Бикипер
      const cleanPath = img.url.replace('http://localhost:3000/', '');
      return {
        ...img,
        // Склеиваем ссылку ngrok и локальную папку
        url: cleanPath.startsWith('http') ? cleanPath : `${appUrl}/${cleanPath}`,
      };
    }),
  }));
}

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  // Принимаем данные и массив реальных файлов из контроллера
  async create(data: CreateProductDto, imageFiles: any[] = []) {    
    // 1. Проходимся по каждому файлу, сохраняем его на диск и получаем массив путей
    const savedImageUrls = imageFiles.map((file) => {
      // Делаем уникальное имя: ТЕКУЩЕЕ_ВРЕМЯ_имя_файла.jpg
      const uniqueFilename = `${Date.now()}_${file.originalname}`;
      const filePath = path.join(this.uploadDir, uniqueFilename);

      // Физически пишем байты картинки на жесткий диск сервера
      fs.writeFileSync(filePath, file.buffer);

      // Этот путь пойдет в базу данных (например: "uploads/1717800000_tshirt.jpg")
      return `uploads/${uniqueFilename}`;
    });

    // 2. Создаем продукт в Prisma, скармливая ей сгенерированные пути
    return this.prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        description: data.description,
        brand: { connect: { id: data.brandId } },
        category: { connect: { id: data.categoryId } },
        images: {
          // Берем наш массив сохраненных путей и создаем записи в таблице картинок
          create: savedImageUrls.map((url: string) => ({ url })),
        },
        sizes: {
          create: (data.sizes || []).map((size: string) => ({ size })),
        },
      },
      include: productInclude,
    });
  }
}
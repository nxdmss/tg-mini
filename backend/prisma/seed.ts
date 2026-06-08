import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1000&q=80&auto=format&fit=crop`;

const CLOTHING_SIZES = ['S', 'M', 'L', 'XL'];
const SNEAKER_SIZES = ['40', '41', '42', '43', '44'];

type Seed = {
  name: string;
  price: number;
  description: string;
  brand: string;
  category: string;
  images: string[];
  sizes: string[];
};

const PRODUCTS: Seed[] = [
  {
    name: 'Oversize Hoodie',
    price: 4990,
    description: 'Премиальное худи свободного кроя из плотного хлопка с начёсом.',
    brand: 'Nike',
    category: 'Худи',
    images: [img('1576566588028-4147f3842f27')],
    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Essential Cotton Hoodie',
    price: 3490,
    description: 'Базовое худи на каждый день. Мягкий хлопок, аккуратные швы.',
    brand: 'Uniqlo',
    category: 'Худи',
    images: [img('1594633312681-425c7b97ccd1')],
    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Classic White Tee',
    price: 1490,
    description: 'Чистая белая футболка из 100% хлопка. Минимализм в каждой детали.',
    brand: 'Uniqlo',
    category: 'Футболки',
    images: [img('1521572163474-6864f9cf17ab')],
    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Heavyweight Logo Tee',
    price: 2990,
    description: 'Плотная футболка с фирменным принтом. Держит форму после стирок.',
    brand: 'Stussy',
    category: 'Футболки',
    images: [img('1618354691373-d851c5c3a990')],
    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Mountain Down Jacket',
    price: 18990,
    description: 'Тёплый пуховик для города и гор. Водоотталкивающее покрытие.',
    brand: 'The North Face',
    category: 'Куртки',
    images: [img('1551028719-00167b16eac5')],
    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Detroit Work Jacket',
    price: 14990,
    description: 'Культовая рабочая куртка из плотного канваса с подкладкой.',
    brand: 'Carhartt',
    category: 'Куртки',
    images: [img('1503341504253-dff4815485f1')],
    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Slim Fit Jeans',
    price: 4490,
    description: 'Зауженные джинсы из эластичного денима. Идеальная посадка.',
    brand: 'Uniqlo',
    category: 'Брюки',
    images: [img('1542272604-787c3835535d')],
    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Cargo Pants',
    price: 6990,
    description: 'Свободные карго с объёмными карманами. Прочный хлопок.',
    brand: 'Carhartt',
    category: 'Брюки',
    images: [img('1515886657613-9f3515b0c78f')],
    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Air Runner Sneakers',
    price: 12990,
    description: 'Лёгкие кроссовки с амортизацией для города и пробежек.',
    brand: 'Nike',
    category: 'Кроссовки',
    images: [img('1556821840-3a63f95609a7')],
    sizes: SNEAKER_SIZES,
  },
  {
    name: 'Ultra Boost Sneakers',
    price: 13990,
    description: 'Энергичная подошва и дышащий верх. Комфорт на весь день.',
    brand: 'Adidas',
    category: 'Кроссовки',
    images: [img('1578587018452-892bacefd3f2')],
    sizes: SNEAKER_SIZES,
  },
  {
    name: 'Retro Low Sneakers',
    price: 9990,
    description: 'Минималистичные низкие кеды в ретро-стиле. Кожаный верх.',
    brand: 'Adidas',
    category: 'Кроссовки',
    images: [img('1542291026-7eec264c27ff')],
    sizes: SNEAKER_SIZES,
  },
  {
    name: 'Knit Beanie',
    price: 1990,
    description: 'Тёплая шапка крупной вязки. Универсальный аксессуар.',
    brand: 'Carhartt',
    category: 'Аксессуары',
    images: [img('1620012253295-c15cc3e65df4')],
    sizes: ['OS'],
  },
];

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productSize.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();

  const brandNames = [...new Set(PRODUCTS.map((p) => p.brand))];
  const categoryNames = [...new Set(PRODUCTS.map((p) => p.category))];

  const brands = new Map<string, string>();
  for (const name of brandNames) {
    const b = await prisma.brand.create({ data: { name } });
    brands.set(name, b.id);
  }

  const categories = new Map<string, string>();
  for (const name of categoryNames) {
    const c = await prisma.category.create({ data: { name } });
    categories.set(name, c.id);
  }

  for (const p of PRODUCTS) {
    await prisma.product.create({
      data: {
        name: p.name,
        price: p.price,
        description: p.description,
        inStock: true,
        brand: { connect: { id: brands.get(p.brand)! } },
        category: { connect: { id: categories.get(p.category)! } },
        images: { create: p.images.map((url) => ({ url })) },
        sizes: { create: p.sizes.map((size) => ({ size })) },
      },
    });
  }

  console.log(
    `Seeded ${PRODUCTS.length} products, ${brandNames.length} brands, ${categoryNames.length} categories.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

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
    description: 'Не пойму',
    brand: 'Nike',
    category: 'Худи',
    images: [img('1620799140408-edc6dcb6d633')],    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Essential Cotton Hoodie',
    price: 3490,
    description: 'Зачем',
    brand: 'Uniqlo',
    category: 'Худи',
    images: [img('1620799140408-edc6dcb6d633')],
    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Classic White Tee',
    price: 1490,
    description: 'Ты',
    brand: 'Uniqlo',
    category: 'Футболки',
    images: [img('1620799140408-edc6dcb6d633')],
    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Heavyweight Logo Tee',
    price: 2990,
    description: 'Это',
    brand: 'Stussy',
    category: 'Футболки',
    images: [img('1620799140408-edc6dcb6d633')],
    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Mountain Down Jacket',
    price: 18990,
    description: 'Читаешь',
    brand: 'The North Face',
    category: 'Куртки',
    images: [img('1620799140408-edc6dcb6d633')],
    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Detroit Work Jacket',
    price: 14990,
    description: 'Фрик',
    brand: 'Carhartt',
    category: 'Куртки',
    images: [img('1620799140408-edc6dcb6d633')],
    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Slim Fit Jeans',
    price: 4490,
    description: 'Тупой',
    brand: 'Uniqlo',
    category: 'Брюки',
    images: [img('1620799140408-edc6dcb6d633')],
    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Cargo Pants',
    price: 6990,
    description: 'АХАХХХ',
    brand: 'Carhartt',
    category: 'Брюки',
    images: [img('1620799140408-edc6dcb6d633')],
    sizes: CLOTHING_SIZES,
  },
  {
    name: 'Air Runner Sneakers',
    price: 12990,
    description: 'ВУАХАХАХАХ',
    brand: 'Nike',
    category: 'Кроссовки',
    images: [img('1620799140408-edc6dcb6d633')],
    sizes: SNEAKER_SIZES,
  },
  {
    name: 'Ultra Boost Sneakers',
    price: 13990,
    description: 'ЛОХ',
    brand: 'Adidas',
    category: 'Кроссовки',
    images: [img('1620799140408-edc6dcb6d633')],
    sizes: SNEAKER_SIZES,
  },
  {
    name: 'Retro Low Sneakers',
    price: 9990,
    description: 'ИДИОТ',
    brand: 'Adidas',
    category: 'Кроссовки',
    images: [img('1620799140408-edc6dcb6d633')],
    sizes: SNEAKER_SIZES,
  },
  {
    name: 'Knit Beanie',
    price: 1990,
    description: 'сорри',
    brand: 'Carhartt',
    category: 'Аксессуары',
    images: [img('1620799140408-edc6dcb6d633')],
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

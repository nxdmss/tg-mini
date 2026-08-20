import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1000&q=80&auto=format&fit=crop`;

type SizeStock = {
  size: string;
  stock: number;
};

type Seed = {
  name: string;
  price: number;
  description: string;
  brand: string;
  category: string;
  images: string[];
  sizes: SizeStock[];
};

const clothingSizes = (
  s: number,
  m: number,
  l: number,
  xl: number,
): SizeStock[] => [
  { size: 'S', stock: s },
  { size: 'M', stock: m },
  { size: 'L', stock: l },
  { size: 'XL', stock: xl },
];

const sneakerSizes = (
  size40: number,
  size41: number,
  size42: number,
  size43: number,
  size44: number,
): SizeStock[] => [
  { size: '40', stock: size40 },
  { size: '41', stock: size41 },
  { size: '42', stock: size42 },
  { size: '43', stock: size43 },
  { size: '44', stock: size44 },
];

const PRODUCTS: Seed[] = [
  {
    name: 'Essential Cotton Hoodie',
    price: 3490,
    description:
      'Базовое худи на каждый день. Мягкий хлопок, аккуратные швы.',
    brand: 'Uniqlo',
    category: 'Худи',
    images: [
      img('1594633312681-425c7b97ccd1'),
    ],
    sizes: clothingSizes(3, 5, 2, 1),
  },

  {
    name: 'Classic White Tee',
    price: 1490,
    description:
      'Чистая белая футболка из 100% хлопка. Минимализм в каждой детали.',
    brand: 'Uniqlo',
    category: 'Футболки',
    images: [
      img('1521572163474-6864f9cf17ab'),
    ],
    sizes: clothingSizes(4, 7, 5, 2),
  },

  {
    name: 'Heavyweight Logo Tee',
    price: 2990,
    description:
      'Плотная футболка с фирменным принтом. Держит форму после стирок.',
    brand: 'Stussy',
    category: 'Футболки',
    images: [
      img('1618354691373-d851c5c3a990'),
    ],
    sizes: clothingSizes(2, 4, 0, 1),
  },

  {
    name: 'Mountain Down Jacket',
    price: 18990,
    description:
      'Тёплый пуховик для города и гор. Водоотталкивающее покрытие.',
    brand: 'The North Face',
    category: 'Куртки',
    images: [
      img('1551028719-00167b16eac5'),
    ],
    sizes: clothingSizes(1, 3, 2, 0),
  },

  {
    name: 'Detroit Work Jacket',
    price: 14990,
    description:
      'Культовая рабочая куртка из плотного канваса с подкладкой.',
    brand: 'Carhartt',
    category: 'Куртки',
    images: [
      img('1503341504253-dff4815485f1'),
    ],
    sizes: clothingSizes(2, 2, 3, 1),
  },

  {
    name: 'Slim Fit Jeans',
    price: 4490,
    description:
      'Зауженные джинсы из эластичного денима. Идеальная посадка.',
    brand: 'Uniqlo',
    category: 'Брюки',
    images: [
      img('1542272604-787c3835535d'),
    ],
    sizes: clothingSizes(4, 6, 3, 2),
  },

  {
    name: 'Cargo Pants',
    price: 6990,
    description:
      'Свободные карго с объёмными карманами. Прочный хлопок.',
    brand: 'Carhartt',
    category: 'Брюки',
    images: [
      img('1515886657613-9f3515b0c78f'),
    ],
    sizes: clothingSizes(2, 5, 1, 0),
  },

  {
    name: 'Air Runner Sneakers',
    price: 12990,
    description:
      'Лёгкие кроссовки с амортизацией для города и пробежек.',
    brand: 'Nike',
    category: 'Кроссовки',
    images: [
      img('1556821840-3a63f95609a7'),
    ],
    sizes: sneakerSizes(2, 4, 6, 3, 1),
  },

  {
    name: 'Ultra Boost Sneakers',
    price: 13990,
    description:
      'Энергичная подошва и дышащий верх. Комфорт на весь день.',
    brand: 'Adidas',
    category: 'Кроссовки',
    images: [
      img('1578587018452-892bacefd3f2'),
    ],
    sizes: sneakerSizes(1, 3, 5, 2, 0),
  },

  {
    name: 'Retro Low Sneakers',
    price: 9990,
    description:
      'Минималистичные низкие кеды в ретро-стиле. Кожаный верх.',
    brand: 'Adidas',
    category: 'Кроссовки',
    images: [
      img('1542291026-7eec264c27ff'),
    ],
    sizes: sneakerSizes(3, 4, 4, 2, 1),
  },

  {
    name: 'Knit Beanie',
    price: 1990,
    description:
      'Тёплая шапка крупной вязки. Универсальный аксессуар.',
    brand: 'Carhartt',
    category: 'Аксессуары',
    images: [
      img('1620012253295-c15cc3e65df4'),
    ],
    sizes: [
      {
        size: 'OS',
        stock: 8,
      },
    ],
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

  const brandNames = [
    ...new Set(
      PRODUCTS.map(
        (product) => product.brand,
      ),
    ),
  ];

  const categoryNames = [
    ...new Set(
      PRODUCTS.map(
        (product) => product.category,
      ),
    ),
  ];

  const brands =
    new Map<string, string>();

  for (const name of brandNames) {
    const brand =
      await prisma.brand.create({
        data: {
          name,
        },
      });

    brands.set(
      name,
      brand.id,
    );
  }

  const categories =
    new Map<string, string>();

  for (const name of categoryNames) {
    const category =
      await prisma.category.create({
        data: {
          name,
        },
      });

    categories.set(
      name,
      category.id,
    );
  }

  for (const product of PRODUCTS) {
    const hasStock =
      product.sizes.some(
        (item) =>
          item.stock > 0,
      );

    await prisma.product.create({
      data: {
        name:
          product.name,

        price:
          product.price,

        description:
          product.description,

        inStock:
          hasStock,

        brand: {
          connect: {
            id: brands.get(
              product.brand,
            )!,
          },
        },

        category: {
          connect: {
            id: categories.get(
              product.category,
            )!,
          },
        },

        images: {
          create:
            product.images.map(
              (
                url,
                index,
              ) => ({
                url,
                sortOrder:
                  index,
              }),
            ),
        },

        sizes: {
          create:
            product.sizes.map(
              ({
                size,
                stock,
              }) => ({
                size,
                stock,
              }),
            ),
        },
      },
    });
  }

  console.log(
    `Seeded ${PRODUCTS.length} products, ${brandNames.length} brands, ${categoryNames.length} categories with stock.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);

    await prisma.$disconnect();

    process.exit(1);
  });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.product.create({
    data: {
      name: 'Black Hoodie Oversize',
      price: 4990,
      description: 'Премиум худи черного цвета',
      inStock: true,
      brand: {
        create: { name: 'Nike' },
      },
      category: {
        create: { name: 'Худи' },
      },
      images: {
        create: [{ url: 'https://picsum.photos/400' }],
      },
      sizes: {
        create: [{ size: 'S' }, { size: 'M' }, { size: 'L' }],
      },
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
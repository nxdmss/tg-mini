import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_SHOP = {
  id: 'shop_swagystan',
  name: 'SWA6Y5TAN',
  slug: 'swagystan',
  description: 'Главный магазин SWA6Y5TAN',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  accentColor: '#000000',
};

async function main() {
  const shop = await prisma.shop.upsert({
    where: {
      slug: DEFAULT_SHOP.slug,
    },
    update: {
      name: DEFAULT_SHOP.name,
      description: DEFAULT_SHOP.description,
      backgroundColor: DEFAULT_SHOP.backgroundColor,
      textColor: DEFAULT_SHOP.textColor,
      accentColor: DEFAULT_SHOP.accentColor,
      isActive: true,
      deletedAt: null,
    },
    create: {
      ...DEFAULT_SHOP,
      isActive: true,
    },
  });

  const result = await prisma.product.updateMany({
    where: {
      shopId: null,
    },
    data: {
      shopId: shop.id,
    },
  });

  console.log(`Default shop ready: ${shop.name} (${shop.slug})`);
  console.log(`Attached ${result.count} existing products to ${shop.name}.`);
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

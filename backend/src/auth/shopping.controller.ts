import { BadRequestException, Body, Controller, Get, Header, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramAuthGuard } from './telegram-auth.guard';

@Controller('account/shopping')
@UseGuards(TelegramAuthGuard)
export class ShoppingController {
  constructor(private readonly prisma: PrismaService) {}

  private user(req: any): string {
    if (!req.user?.id) throw new UnauthorizedException();
    return req.user.id;
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  async get(@Req() req: any) {
    const userId = this.user(req);
    const [rows, favorites] = await Promise.all([
      this.prisma.accountCartItem.findMany({ where: { userId } }),
      this.prisma.accountFavorite.findMany({ where: { userId } }),
    ]);
    const products = await this.prisma.product.findMany({
      where: { id: { in: rows.map(r => r.productId) }, deletedAt: null },
      include: { sizes: true, images: { orderBy: { sortOrder: 'asc' } } },
    });
    const items = rows.flatMap(row => {
      const p = products.find(p => p.id === row.productId);
      if (!p) return [];
      const stock = p.inStock ? p.sizes.find(s => s.size === row.size)?.stock ?? 0 : 0;
      return [{ productId: p.id, size: row.size, quantity: Math.min(row.quantity, Math.max(1, stock)),
        maxStock: stock, name: p.name, price: p.price, image: p.images[0]?.url }];
    });
    return { items, ids: favorites.map(f => f.productId) };
  }

  @Post()
  async change(@Req() req: any, @Body() body: any) {
    const userId = this.user(req);
    if (body?.type === 'clear') {
      await this.prisma.accountCartItem.deleteMany({ where: { userId } });
      return { ok: true };
    }
    const { productId, size, quantity, type, active } = body ?? {};
    if (typeof productId !== 'string' || !productId || productId.length > 100)
      throw new BadRequestException('Invalid product');
    if (type === 'favorite' && typeof active === 'boolean') {
      if (active) {
        if (!await this.prisma.product.findFirst({ where: { id: productId, deletedAt: null } }))
          throw new BadRequestException('Product unavailable');
        await this.prisma.accountFavorite.upsert({ where: { userId_productId: { userId, productId } },
          create: { userId, productId }, update: {} });
      } else await this.prisma.accountFavorite.deleteMany({ where: { userId, productId } });
    } else if (type === 'cart' && typeof size === 'string' && size.length > 0 && size.length <= 100
      && Number.isInteger(quantity) && quantity >= 0 && quantity <= 999) {
      if (!quantity) await this.prisma.accountCartItem.deleteMany({ where: { userId, productId, size } });
      else {
        const p = await this.prisma.product.findFirst({ where: { id: productId, deletedAt: null }, include: { sizes: true } });
        const stock = p?.inStock ? p.sizes.find(s => s.size === size)?.stock ?? 0 : 0;
        if (!stock) throw new BadRequestException('Size out of stock');
        const count = Math.min(quantity, stock);
        await this.prisma.accountCartItem.upsert({ where: { userId_productId_size: { userId, productId, size } },
          create: { userId, productId, size, quantity: count }, update: { quantity: count } });
      }
    } else throw new BadRequestException('Invalid shopping operation');
    return { ok: true };
  }
}

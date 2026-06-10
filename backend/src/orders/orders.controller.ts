import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './create-order.dto';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';

@Controller('orders')
@UseGuards(TelegramAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() body: CreateOrderDto, @Req() req: any) {
    return this.ordersService.create(body, req.user);
  }

  @Get('me')
  findMine(@Req() req: any) {
    return this.ordersService.findByTelegramId(req.user?.telegramId ?? 'web-guest');
  }
}

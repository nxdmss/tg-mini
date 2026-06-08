import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() body: CreateOrderDto) {
    return this.ordersService.create(body);
  }

  @Get(':telegramId')
  findByTelegramId(@Param('telegramId') telegramId: string) {
    return this.ordersService.findByTelegramId(telegramId);
  }
}

import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './create-order.dto';
import { UpdateOrderStatusDto } from './update-order-status.dto';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

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

  @Get('admin')
  @UseGuards(AdminGuard)
  findAllForAdmin() {
    return this.ordersService.findAllForAdmin();
  }

  @Patch('admin/:id/status')
  @UseGuards(AdminGuard)
  updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, body.status);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { OrdersService } from './orders.service';

import { CreateOrderDto } from './create-order.dto';

import { UpdateOrderStatusDto } from './update-order-status.dto';

import { TelegramAuthGuard } from '../auth/telegram-auth.guard';

import { AdminGuard } from '../auth/admin.guard';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  create(
    @Body() body: CreateOrderDto,
  ) {
    return this.ordersService.create(
      body,
    );
  }

  @Get('me')
  @UseGuards(TelegramAuthGuard)
  findMine(
    @Req() req: any,
  ) {
    return this.ordersService.findMine(
      req.user,
    );
  }

  @Get('admin')
  @UseGuards(
    TelegramAuthGuard,
    AdminGuard,
  )
  findAllForAdmin() {
    return this.ordersService.findAllForAdmin();
  }

  @Patch('admin/:id/status')
  @UseGuards(
    TelegramAuthGuard,
    AdminGuard,
  )
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(
      id,
      body.status,
    );
  }
}
import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { TelegramAdminGuard } from '../auth/telegram-admin.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { ArchiveOrderDto } from './archive-order.dto';
import { CreateOrderDto } from './create-order.dto';
import { OrdersService } from './orders.service';
import { WebAuthService } from '../auth/web-auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { UpdateOrderStatusDto } from './update-order-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService, private readonly webAuth: WebAuthService) {}

  @Post()
  async create(@Body() body: CreateOrderDto, @Req() req: any) {
    const authorization = req.headers?.authorization;
    let userId: string | undefined;
    if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
      const token = authorization.slice(7).trim();
      if (!token) throw new UnauthorizedException("Missing token");
      const user = await this.webAuth.getUserFromToken(token);
      userId = user.id;
    }
    return this.ordersService.create(body, userId);
  }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  @UseGuards(TelegramAuthGuard)
  findMine(@Req() req: any) {
    return this.ordersService.findMine(req.user);
  }

  @Get('admin')
  @Header('Cache-Control', 'no-store')
  @UseGuards(TelegramAdminGuard)
  findAllForAdmin() {
    return this.ordersService.findAllForAdmin();
  }

  @Patch('admin/:id/status')
  @UseGuards(TelegramAdminGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, body.status);
  }

  @Patch('admin/:id/archive')
  @UseGuards(TelegramAdminGuard)
  archive(
    @Param('id') id: string,
    @Body() body: ArchiveOrderDto,
  ) {
    return this.ordersService.setArchived(id, body.archived);
  }
}

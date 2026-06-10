import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, NotificationsService],
})
export class OrdersModule {}

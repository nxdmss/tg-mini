import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { NotificationsService } from '../notifications/notifications.service';

import { AdminOrderMutationsController } from './admin-order-mutations.controller';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    OrdersController,
    AdminOrderMutationsController,
  ],

  providers: [
    OrdersService,
    NotificationsService,
  ],
})
export class OrdersModule {}

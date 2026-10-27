import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VisitorsController],
  providers: [VisitorsService],
})
export class VisitorsModule {}

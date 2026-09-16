import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { JwtGuard } from 'src/common/guards/jwt/jwt.guard';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TicketsController],
  providers: [TicketsService, JwtGuard],
})
export class TicketsModule {}

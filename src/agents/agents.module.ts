import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { JwtGuard } from 'src/common/guards/jwt/jwt.guard';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AgentsController],
  providers: [AgentsService, JwtGuard],
})
export class AgentsModule {}

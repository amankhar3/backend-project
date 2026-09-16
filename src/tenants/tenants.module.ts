import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { JwtGuard } from 'src/common/guards/jwt/jwt.guard';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TenantsController],
  providers: [TenantsService, JwtGuard],
})
export class TenantsModule {}

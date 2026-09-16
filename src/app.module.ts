import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TicketsModule } from './tickets/tickets.module';
import { TenantsModule } from './tenants/tenants.module';
import { AgentsModule } from './agents/agents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6380),
        },
      }),
      inject: [ConfigService],
    }),

    DbModule,
    AuthModule,
    UserModule,
    TicketsModule,
    TenantsModule,
    AgentsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

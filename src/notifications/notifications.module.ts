import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { BullModule } from '@nestjs/bullmq';
import { DbModule } from 'src/db/db.module';
import { NotificationsProcessor } from './notifications.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
    DbModule, // processor can access database
  ],
  providers: [
    NotificationsService, // service to add notifications to the queue
    NotificationsProcessor, // worker to process notifications
  ],
  exports: [NotificationsService], // other modules can use the service
})
export class NotificationsModule {}

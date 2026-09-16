import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { NotificationStatus, NotificatioType } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { Job } from 'bullmq';

export interface NotificationJob {
  customerId: string;
  type: NotificatioType;
  message: string;
}

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);
  constructor(private readonly dbService: DbService) {
    super();
  }

  async process(job: Job<NotificationJob>) {
    this.logger.log(
      `Processing notification job ${job.id as string} for user ${job.data.customerId}`,
    );

    try {
      await this.dbService.notification.create({
        data: {
          customerId: job.data.customerId,
          type: job.data.type,
          status: NotificationStatus.UNREAD,
          message: job.data.message,
        },
      });

      this.logger.log(
        `Notification created successfully for customer ${job.data.customerId}`,
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error as Error);
    }
  }
}

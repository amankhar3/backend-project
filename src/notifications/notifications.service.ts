import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificatioType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(@InjectQueue('notifications') private readonly queue: Queue) {}

  async addNotification(
    customerId: string,
    type: NotificatioType,
    message: string,
  ) {
    await this.queue.add('createNotification', { customerId, type, message });
  }
}

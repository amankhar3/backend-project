import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Agent, NotificatioType } from '@prisma/client';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);
  constructor(
    private readonly dbService: DbService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async validateTicketContext(
    tenant: string,
    customer: string,
    agent?: string,
  ) {
    try {
      const tenantData = await this.dbService.tenant.findUnique({
        where: { id: tenant },
      });
      if (!tenantData) throw new BadRequestException('Tenant not found');

      const customerData = await this.dbService.customer.findUnique({
        where: { id: customer },
      });
      if (!customerData) throw new BadRequestException('Customer not found');
      if (customerData?.tenantId !== tenant)
        throw new BadRequestException('Customer does not belong to the tenant');

      let agentData: Agent | null = null;
      if (agent) {
        agentData = await this.dbService.agent.findUnique({
          where: { id: agent },
        });
        if (!agentData) throw new BadRequestException('Agent not found');
        if (agentData?.tenantId !== tenant)
          throw new BadRequestException('Agent does not belong to the tenant');
      }

      return {
        tenantData,
        customerData,
        agentData,
      };
    } catch (error) {
      this.logger.error(error as Error);
      throw new InternalServerErrorException(error as Error);
    }
  }

  async getTickets(tenant: string, customer: string) {
    try {
      await this.validateTicketContext(tenant, customer);

      const tickets = await this.dbService.ticket.findMany({
        where: { tenantId: tenant },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              email: true,
            },
          },
          tenant: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(
        `Tickets fetched successfully ${JSON.stringify(tickets)}`,
      );

      return {
        tickets,
      };
    } catch (error) {
      this.logger.error(error as Error);
      throw new InternalServerErrorException(error as Error);
    }
  }

  async createTicket(body: CreateTicketDto) {
    try {
      const { title, description, status, tenant, customer } = body;

      const { tenantData, customerData } = await this.validateTicketContext(
        tenant,
        customer,
      );

      const newTicket = await this.dbService.ticket.create({
        data: {
          title,
          description,
          status,
          tenantId: tenantData.id,
          customerId: customerData.id,
          agentId: null,
        },
      });

      const notificationMessage = `Ticket ${newTicket.title} created successfully for customer ${customerData.email}`;
      this.logger.log(notificationMessage);

      // Adding notifications to job queue
      await this.notificationsService.addNotification(
        customerData.id,
        NotificatioType.INFO,
        `Ticket ${newTicket.title} created successfully for customer ${customerData.email}`,
      );

      return {
        newTicket,
        notification: {
          message: notificationMessage,
          type: NotificatioType.INFO,
        },
      };
    } catch (error) {
      this.logger.error(error as Error);
      throw new InternalServerErrorException(error as Error);
    }
  }
}

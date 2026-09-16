import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { NotificatioType, TicketStatus } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  constructor(
    private readonly dbService: DbService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getTickets(agent: string) {
    try {
      // Validate agent
      const existingAgent = await this.dbService.agent.findUnique({
        where: { id: agent },
      });
      if (!existingAgent) throw new BadRequestException('Agent not found');

      const tickets = await this.dbService.ticket.findMany({
        where: { agentId: agent },
        include: {
          tenant: {
            select: {
              id: true,
              email: true,
            },
          },
          customer: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Tickets fetched successfully for agent ${agent}`);

      return {
        tickets,
      };
    } catch (error) {
      this.logger.error(error as Error);
      throw new InternalServerErrorException(error as Error);
    }
  }

  async updateTicket(agent: string, ticketId: string) {
    try {
      // Validate the agent
      const existingAgent = await this.dbService.agent.findUnique({
        where: { id: agent },
      });
      if (!existingAgent) throw new BadRequestException('Agent not found');

      // Validate the ticket
      const existingTicket = await this.dbService.ticket.findUnique({
        where: { id: ticketId },
      });
      if (!existingTicket) throw new BadRequestException('Ticket not found');

      // Validate that the agent is assigned to this ticket
      if (existingTicket.agentId !== agent) {
        throw new BadRequestException('Agent not assigned to this ticket.');
      }

      // Check ticket is already closed
      if (existingTicket.status === TicketStatus.CLOSED) {
        throw new BadRequestException('Ticket is already closed.');
      }

      // Toggle status: OPEN -> IN_PROGRESS, IN_PROGRESS -> CLOSED
      let newStatus: TicketStatus;
      if (existingTicket.status === TicketStatus.OPEN) {
        newStatus = TicketStatus.IN_PROGRESS;
      } else if (existingTicket.status === TicketStatus.IN_PROGRESS) {
        newStatus = TicketStatus.CLOSED;
      } else {
        newStatus = existingTicket.status;
      }

      // Update the ticket status
      const updatedTicket = await this.dbService.ticket.update({
        where: { id: ticketId },
        data: { status: newStatus },
        include: {
          tenant: {
            select: {
              id: true,
              email: true,
            },
          },
          customer: {
            select: {
              id: true,
              userId: true,
              email: true,
            },
          },
        },
      });

      const statusMessage =
        newStatus === TicketStatus.IN_PROGRESS
          ? 'is now in progress'
          : newStatus === TicketStatus.CLOSED
            ? 'has been closed'
            : 'status has been updated';

      const notificationMessage = `Your ticket ${updatedTicket.title} ${statusMessage} by agent ${existingAgent.email}`;
      this.logger.log(notificationMessage);

      await this.notificationsService.addNotification(
        updatedTicket.customer.id,
        NotificatioType.INFO,
        `Your ticket "${updatedTicket.title}" ${statusMessage} by agent ${existingAgent.email}`,
      );

      return {
        ticket: updatedTicket,
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

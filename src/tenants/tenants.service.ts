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
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);
  constructor(
    private readonly dbService: DbService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getTickets(tenant: string) {
    try {
      const tickets = await this.dbService.ticket.findMany({
        where: { tenantId: tenant },
      });

      this.logger.log(`Tickets fetched successfully for tenant ${tenant}`);

      return {
        tickets,
      };
    } catch (error) {
      this.logger.error(error as Error);
      throw new InternalServerErrorException(error as Error);
    }
  }

  async assignAgent(tenant: string, ticketId: string) {
    try {
      // Validate tenant
      const existingTenant = await this.dbService.tenant.findUnique({
        where: { id: tenant },
      });
      if (!existingTenant) throw new BadRequestException('Tenant not found');

      // Validate ticket
      const existingTicket = await this.dbService.ticket.findUnique({
        where: { id: ticketId },
      });
      if (!existingTicket) throw new BadRequestException('Ticket not found');

      if (existingTicket.tenantId !== tenant)
        throw new BadRequestException('Ticket does not belong to the tenant');

      if (existingTicket.status !== TicketStatus.OPEN)
        throw new BadRequestException('Ticket is not open');

      if (existingTicket.agentId)
        throw new BadRequestException('Ticket is already assigned to an agent');

      // Get all available agents for the tenant
      const availableAgents = await this.dbService.agent.findMany({
        where: { tenantId: tenant },
        include: {
          tickets: {
            where: {
              status: {
                in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS],
              },
            },
          },
        },
      });

      if (availableAgents.length === 0)
        throw new BadRequestException('No agents available');

      // Count the number of tickets for each agent
      const aggentCount = availableAgents.map((agent) => ({
        agentId: agent.id,
        tickets: agent.tickets.length,
        agent,
      }));

      // Sort the agents by the number of tickets
      const sortedAgents = aggentCount.sort((a, b) => b.tickets - a.tickets);

      // Assign the ticket to the agent with the least number of tickets
      const assignedAgent = sortedAgents[0];
      if (!assignedAgent) throw new BadRequestException('No agents available');

      const updatedTicket = await this.dbService.ticket.update({
        where: { id: ticketId },
        data: { agentId: assignedAgent.agentId },
        include: {
          customer: {
            select: {
              id: true,
              userId: true,
              email: true,
            },
          },
          agent: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      const notificationMessage = `Ticket ${updatedTicket.title} assigned to agent ${assignedAgent.agent.email}`;
      this.logger.log(notificationMessage);

      // Notify customer when agent is assigned
      await this.notificationsService.addNotification(
        updatedTicket.customer.id,
        NotificatioType.INFO,
        `Ticket ${updatedTicket.title} assigned to agent ${assignedAgent.agent.email}`,
      );

      return {
        message: 'Ticket assigned successfully',
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

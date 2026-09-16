import { Controller, Get, Put, Query, UseGuards, Param } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { JwtGuard } from 'src/common/guards/jwt/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get('tickets')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async getTickets(@Query('agent') agent: string) {
    return await this.agentsService.getTickets(agent);
  }

  @Put('update-ticket/:ticketId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async updateTicket(
    @Query('agent') agent: string,
    @Param('ticketId') ticketId: string,
  ) {
    return await this.agentsService.updateTicket(agent, ticketId);
  }
}

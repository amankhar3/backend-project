import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { JwtGuard } from 'src/common/guards/jwt/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('ticket')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('create')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async create(@Body() body: CreateTicketDto) {
    return this.ticketsService.createTicket(body);
  }

  @Get('get')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async get(
    @Query('tenant') tenant: string,
    @Query('customer') customer: string,
  ) {
    return this.ticketsService.getTickets(tenant, customer);
  }
}

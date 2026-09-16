import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtGuard } from 'src/common/guards/jwt/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('tenant')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('tickets')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async tickets(@Query('tenant') tenant: string) {
    return await this.tenantsService.getTickets(tenant);
  }

  @Post('assign-agent')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async assignAgent(
    @Query('tenant') tenant: string,
    @Query('ticketId') ticketId: string,
  ) {
    return await this.tenantsService.assignAgent(tenant, ticketId);
  }
}

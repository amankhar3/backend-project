import { IsString, IsNotEmpty } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  status: TicketStatus;

  @IsString()
  @IsNotEmpty()
  tenant: string;

  @IsString()
  @IsNotEmpty()
  customer: string;
}

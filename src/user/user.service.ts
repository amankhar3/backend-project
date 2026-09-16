import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { DbService } from 'src/db/db.service';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly dbService: DbService) {}

  async getUserByEmail(email: string) {
    try {
      return await this.dbService.user.findUnique({ where: { email } });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error as Error);
    }
  }

  async createUser(body: RegisterDto) {
    try {
      const { email, password, role, tenantId } = body;
      const newUser = await this.dbService.user.create({
        data: { email, password, role } as Prisma.UserCreateInput,
      });

      if (role === Role.CUSTOMER) {
        if (!tenantId) throw new BadRequestException('Tenant ID is required');

        const newCustomer = await this.dbService.customer.create({
          data: { email, password: password, userId: newUser.id, tenantId },
        });

        this.logger.log(`Customer ${newCustomer.id} created successfully`);
        return {
          newUser,
          customerId: newCustomer.id,
          tenantId: newCustomer.tenantId,
        };
      } else if (role === Role.AGENT) {
        if (!tenantId) throw new BadRequestException('Tenant ID is required');

        const newAgent = await this.dbService.agent.create({
          data: { email, password: password, userId: newUser.id, tenantId },
        });

        this.logger.log(`Agent ${newAgent.id} created successfully`);
        return {
          newUser,
          agentId: newAgent.id,
          tenantId: newAgent.tenantId,
        };
      } else if (role === Role.TENANT) {
        const newTenant = await this.dbService.tenant.create({
          data: { email, password: password, userId: newUser.id },
        });

        this.logger.log(`Tenant ${newTenant.id} created successfully`);
        return {
          newUser,
          tenantId: newTenant.id,
        };
      }

      this.logger.log(`User ${newUser.id} created successfully`);
      return { newUser, userId: newUser.id };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error as Error);
    }
  }
}

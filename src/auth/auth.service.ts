/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async register(body: RegisterDto) {
    try {
      const { email, password, role, tenantId } = body;

      const existingUser = await this.userService.getUserByEmail(email);

      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);

      const response = await this.userService.createUser({
        email,
        password: hashedPassword,
        role,
        tenantId,
      });

      // Generate token
      const token = await this.jwtService.signAsync({
        userId: response.newUser.id,
      });

      this.logger.log(`User ${response.newUser.id} registered successfully`);

      return {
        user: response,
        token,
      };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async login(body: LoginDto) {
    try {
      const { email, password, role } = body;

      const existingUser = await this.userService.getUserByEmail(email);

      if (!existingUser) {
        throw new BadRequestException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        existingUser.password,
      );

      if (!isPasswordValid) throw new BadRequestException('Invalid password');

      // Generate token
      const token = await this.jwtService.signAsync({
        userId: existingUser.id,
      });

      this.logger.log(`User ${existingUser.id} logged in successfully`);

      return { user: existingUser, token };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error as Error);
    }
  }
}

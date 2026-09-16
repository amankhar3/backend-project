import { IsString, IsEmail, IsNotEmpty, IsIn } from 'class-validator';

const roles = ['admin', 'user'] as const;

export class LoginDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(roles)
  role: (typeof roles)[number];
}

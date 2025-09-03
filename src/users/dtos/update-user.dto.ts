import { IsEmail, IsString, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  @IsOptional()
  passwordConfirm: string;

  @IsString()
  @IsOptional()
  nickname: string;

  @IsString()
  @IsOptional()
  plan: 'free' | 'team' | 'enterprise';
}

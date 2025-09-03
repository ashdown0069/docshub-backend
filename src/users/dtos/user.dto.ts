import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class UserDto {
  @Expose()
  _id: number;

  @Expose()
  email: string;

  @Expose()
  nickname: string;

  @Expose()
  plan: 'free' | 'team' | 'enterprise';

  @Expose()
  access_token: string;

  @Expose()
  refresh_token: string;
}

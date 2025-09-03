import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({ usernameField: 'email' });
  }
  async validate(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    //패스워드 매칭 로직추가해야함함

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.password != password) {
      throw new UnauthorizedException('password is invalid');
    }
    return user;
  }
}

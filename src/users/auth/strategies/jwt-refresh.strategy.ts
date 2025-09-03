import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { RefreshTokenPayload } from 'src/types/authPayload';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_KEY'),
      passReqToCallback: true,
    });
  }
  async validate(
    req: Request & { body: { refresh_token: string } },
    payload: RefreshTokenPayload,
  ) {
    const user = await this.authService.validateRefreshToken(
      payload.sub,
      req.body.refresh_token,
    );
    return user;
  }
}

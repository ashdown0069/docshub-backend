import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from './auth/auth.service';
import { CurrentUserMiddleware } from './middleware/current-user.middleware';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/common/database/schemas/users.schema';
import { LocalStrategy } from './auth/strategies/local.strategy';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { JwtRefreshStrategy } from './auth/strategies/jwt-refresh.strategy';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  imports: [PassportModule],
  exports: [UsersService, JwtStrategy, AuthService],
})
export class UsersModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(CurrentUserMiddleware).forRoutes('*');
  // }
}

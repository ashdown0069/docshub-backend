import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users.service';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenPayload, JWT_User } from 'src/types/authPayload';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserDocument } from 'src/common/database/schemas/users.schema';
import { comparePassword } from 'src/common/utils/bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(createUserData: CreateUserDto) {
    const { email, nickname, password, passwordConfirm } = createUserData;
    //이메일, 닉네임 중복 확인
    await this.usersService.isDuplicateEmail(email);
    await this.usersService.isDuplicateNickname(nickname);

    //비밀번호 확인

    if (password !== passwordConfirm) {
      throw new BadRequestException('password is not match');
    }
    const user = await this.usersService.create(createUserData);
    if (user) {
      return true;
    }
    return false;
  }
  async login(email: string, password: string) {
    //이메일 확인
    const foundUser = await this.usersService.findOneByEmail(email);
    if (!foundUser) {
      throw new UnauthorizedException({
        message: 'User not found',
        key: 'failed',
      });
    }

    //비밀번호 확인
    const isMatch = await comparePassword(password, foundUser.password);
    if (!isMatch) {
      throw new UnauthorizedException({
        message: 'password is invalid',
        key: 'failed',
      });
    }

    const { access_token, refresh_token } =
      await this.generateTokens(foundUser);

    // const tokenId = await this.updateRefreshToken(foundUser.id, refresh_token);
    foundUser.dbRefreshToken = refresh_token;
    await this.usersService.update(foundUser.id, foundUser);
    return { access_token, refresh_token };
  }

  async signout(user: JWT_User) {
    const foundUser = await this.usersService.findOneById(user.id);
    if (!foundUser) {
      throw new NotFoundException('user not found');
    }

    foundUser.dbRefreshToken = null;
    await this.usersService.update(foundUser.id, foundUser);
    return 'success';
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('user not found');
    }

    if (!user.dbRefreshToken || user.dbRefreshToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    return user;
  }

  async generateTokens(user: UserDocument) {
    const payload = {
      email: user.email,
      nickname: user.nickname,
      sub: user.id,
      plan: user.plan,
    } as AccessTokenPayload;

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(
        {
          sub: user.id,
        },
        {
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }

  async regenAccessToken(user: JWT_User) {
    const payload = {
      email: user.email,
      sub: user.id,
      nickname: user.nickname,
      plan: user.plan,
    } as AccessTokenPayload;

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
    };
  }
}

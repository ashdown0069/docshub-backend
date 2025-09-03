import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { AuthService } from './auth/auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { UserDto } from './dtos/user.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { JwtRefreshAuthGuard } from 'src/guard/jwt-auth-refresh.guard';
import { RefreshTokenDto } from './dtos/token.dto';
import { SigninUserDto } from './dtos/signin-user.dto';
import { JWT_User } from 'src/types/authPayload';
import { Workspace } from 'src/common/database/schemas/workspace.schema';
import { UpdateUserDto } from './dtos/update-user.dto';
@Controller('auth')
// @Serialize(UserDto)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}
  @Patch('/update')
  @UseGuards(JwtAuthGuard)
  async updateUser(@Body() body: UpdateUserDto, @Req() req: Request) {
    const { id: userId } = req.user as JWT_User;
    const updatedUser = await this.usersService.update(userId, body);
    const { access_token } = await this.authService.generateTokens(updatedUser);
    return { accessToken: access_token };
  }

  @Post('/signup')
  async createUser(@Body() body: CreateUserDto) {
    const result = await this.authService.signup(body);
    return result;
  }
  // @UseGuards(LocalAuthGuard) //find user and add req.user
  @Post('/login')
  async signIn(@Body() body: SigninUserDto) {
    // return 'true';
    return await this.authService.login(body.email, body.password);
  }

  @Serialize(UserDto)
  @UseGuards(JwtAuthGuard)
  @Get('/whoami')
  async whoami(@Req() req: Request) {
    return {
      test: 'test',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/signout')
  async signOut(@Req() req: Request) {
    return await this.authService.signout(req.user as JWT_User);
  }

  //regenerate access token by refresh token
  @UseGuards(JwtRefreshAuthGuard)
  @Post('/refresh')
  async refresh(
    @Req()
    req: Request,
  ) {
    return await this.authService.regenAccessToken(req.user as JWT_User);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/myworkspaces')
  async getAllWorkspace(
    @Req()
    req: Request,
  ) {
    const { id } = req.user as JWT_User;
    const foundUser = await this.usersService.findOneById(id);
    if (!foundUser) {
      throw new NotFoundException('user not found');
    }

    // await foundUser.populate({
    //   path: 'joinedWorkspace.workspace',
    //   select: '_id name description members capacity updatedAt createdAt',
    // });
    // const newData = (foundUser.joinedWorkspace as JoinedWorkspace[]).map(
    //   (item: JoinedWorkspace) => {
    //     const workspace = item.workspace as Workspace;
    //     const isBookmarked = item.isBookmarked;

    //     return {
    //       isBookmarked,
    //       ...workspace,
    //       members: workspace.members.length,
    //     };
    //   },
    // );

    //   return foundUser.joinedWorkspace.map((item:WorkspaceSubSchema) => ({
    //     isBookmarked: item.isBookmarked,
    //     workspaceId: item.workspace._id,
    //     name: item.workspace.name,
    //     description: item.workspace.description,
    //     membersCount: item.workspace.members.length,
    //     capacity: item.workspace.capacity,
    //     createdAt: item.workspace.createdAt,
    //     updatedAt: item.workspace.updatedAt
    // }));
    // }
  }
}

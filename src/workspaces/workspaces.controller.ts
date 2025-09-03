import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateWorkspaceDto } from './dtos/create-workspace.dto';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { Request } from 'express';
import { JWT_User } from 'src/types/authPayload';
import { UpdateWorkspaceDto } from './dtos/update-workspace.dto';
import {
  DeleteWorkspaceDto,
  DeleteWorkspaceMemberDto,
} from './dtos/delete-workspace.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { FindWorkspaceDto, FindWorkspacesDto } from './dtos/find-workspace.dto';
import { SearchWorkspaceDto } from './dtos/search-workspace.dto';
import { CreateAnnouncementsDto } from './dtos/create-announcements';

@Controller('/workspace')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private workspaceService: WorkspacesService) {}

  @Serialize(SearchWorkspaceDto)
  @Get('/search')
  async searchWorkspaces(@Req() req: Request, @Query('query') query: string) {
    const { id: userId } = req.user as JWT_User;
    return this.workspaceService.searchWorkspaces(query, userId);
  }
  @Serialize(FindWorkspaceDto)
  @Get('/info/:id')
  async getWorkspace(@Param('id') workspaceId: string, @Req() req: Request) {
    const { id: userId } = req.user as JWT_User;
    return this.workspaceService.findOneById(workspaceId);
  }

  @Serialize(FindWorkspacesDto)
  @Get()
  async findAllWorkspaces(@Req() req: Request) {
    const { id: userId } = req.user as JWT_User;
    return this.workspaceService.findAll(userId);
  }

  @Post()
  async createWorkspace(@Body() body: CreateWorkspaceDto, @Req() req: Request) {
    const { id } = req.user as JWT_User;
    if (body.password !== body.passwordConfirm)
      throw new BadRequestException('Passwords do not match');
    await this.workspaceService.create(
      id,
      body.name,
      body.description,
      body.password,
    );

    return {
      isSuccess: true,
    };
  }

  @Patch()
  async updateWorkspace(@Body() body: UpdateWorkspaceDto, @Req() req: Request) {
    const { id: userId } = req.user as JWT_User;
    const { workspaceId, ...rest } = body;
    await this.workspaceService.update(workspaceId, rest);
    return {
      isSuccess: true,
    };
  }

  @Get('/announcements')
  async getAnnouncements(@Query('workspaceId') workspaceId: string) {
    return await this.workspaceService.getAnnouncements(workspaceId);
  }

  @Post('/announcements')
  async updateAnnouncements(@Body() body: CreateAnnouncementsDto) {
    return await this.workspaceService.updateAnnouncements(body);
  }

  // @Patch('/storage')
  // async updateStorage(@Body() body: UpdateWorkspaceDto, @Req() req: Request) {
  //   const { id: userId } = req.user as JWT_User;
  //   const { workspaceId, ...rest } = body;
  //   await this.workspaceService.updateStorage(workspaceId, userId, rest);
  //   return {
  //     isSuccess: true,
  //   };
  // }

  @Delete()
  async deleteWorkspace(@Body() body: DeleteWorkspaceDto, @Req() req: Request) {
    const { id: userId } = req.user as JWT_User;
    await this.workspaceService.deleteWorkspace(
      body.workspaceId,
      userId,
      body.password,
    );
    return {
      isSuccess: true,
    };
  }

  @Post('/invite')
  async InviteWorkspace() {}
}

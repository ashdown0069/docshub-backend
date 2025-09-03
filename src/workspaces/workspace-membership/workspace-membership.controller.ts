import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { WorkspaceMembershipService } from './workspace-membership.service';
import { UpdateWorkspaceMembershipDto } from './dto/update-workspace-membership.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { JoinWorkspaceMembershipDto } from './dto/join-workspace.dto';
import { Request } from 'express';
import { JWT_User } from 'src/types/authPayload';
import { Workspace } from 'src/common/database/schemas/workspace.schema';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { FindAllUserJoinedWsDto } from './dto/findAll-userjoinedws-dto';
@UseGuards(JwtAuthGuard)
@Controller('workspace-membership')
export class WorkspaceMembershipController {
  constructor(
    private readonly workspaceMembershipService: WorkspaceMembershipService,
  ) {}

  @Post()
  async JoinWorkspace(
    @Body() body: JoinWorkspaceMembershipDto,
    @Req() req: Request,
  ) {
    const { id: userId } = req.user as JWT_User;
    return await this.workspaceMembershipService.join(
      body.workspaceId,
      userId,
      body.workspacePassword,
    );
  }

  @Serialize(FindAllUserJoinedWsDto)
  @Get()
  async findAll(@Req() req: Request): Promise<Workspace[]> {
    const { id: userId } = req.user as JWT_User;
    const foundWorkspaces =
      await this.workspaceMembershipService.findAllUserJoinedWorkspaces(userId);

    return foundWorkspaces.map((items) => items.workspace as Workspace);
  }

  @Get('/:workspaceId')
  async findAllWorkspaceMembers(@Param('workspaceId') workspaceId: string) {
    return await this.workspaceMembershipService.findAllWorkspaceMembers(
      workspaceId,
    );
  }

  @Get('/ismember/:workspaceId')
  async checkIsMember(
    @Param('workspaceId') workspaceId: string,
    @Req() req: Request,
  ) {
    const { id: userId } = req.user as JWT_User;
    return await this.workspaceMembershipService.checkIsMember(
      workspaceId,
      userId,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') workspaceId: string,
    @Req() req: Request,
    @Body() updateWorkspaceMembershipDto: UpdateWorkspaceMembershipDto,
  ) {
    if (updateWorkspaceMembershipDto.role === 'owner') {
      throw new BadRequestException('owner role cannot be changed');
    }

    // return;
    const { id: userId } = req.user as JWT_User;
    return await this.workspaceMembershipService.update(
      userId,
      workspaceId,
      updateWorkspaceMembershipDto,
    );
  }

  @Delete(':id')
  async withDraw(@Param('id') workspaceId: string, @Req() req: Request) {
    const { id: userId } = req.user as JWT_User;
    return await this.workspaceMembershipService.withDraw(userId, workspaceId);
  }
}

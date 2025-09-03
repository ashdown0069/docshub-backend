import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceRoleService } from './workspace-role.service';
import { Role, WorkspacePermission } from 'src/types';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { Request } from 'express';
import { JWT_User } from 'src/types/authPayload';

@Controller('workspace-role/:workspaceId')
@UseGuards(JwtAuthGuard)
export class WorkspaceRoleController {
  constructor(private readonly workspaceRoleService: WorkspaceRoleService) {}

  // 특정 역활의 권한 모두 조회
  @Get()
  @Serialize(UpdatePermissionDto)
  async findAllPermission(@Param('workspaceId') workspaceId: string) {
    return await this.workspaceRoleService.findAll(workspaceId);
  }

  @Get('/role')
  async findMyRole(
    @Param('workspaceId') workspaceId: string,
    @Req() req: Request,
  ) {
    const { id: userId } = req.user as JWT_User;
    return await this.workspaceRoleService.getMyRole(workspaceId, userId);
  }

  // 특정 역할의 권한 조회
  @Get('/:role/:permission')
  async findOnePermission(
    @Param('workspaceId') workspaceId: string,
    @Param('role') role: Role,
    @Param('permission') permission: WorkspacePermission,
  ) {
    return await this.workspaceRoleService.hasPermission(
      workspaceId,
      role,
      permission,
    );
  }

  // 역할 수정
  @Put()
  async updatePermission(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { permissions: UpdatePermissionDto[] },
  ) {
    return await this.workspaceRoleService.update(
      workspaceId,
      body.permissions,
    );
  }
}

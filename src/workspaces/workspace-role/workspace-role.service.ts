import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { WorkspaceRole } from 'src/common/database/schemas/workspace-role.schema';
import { WorkspaceMembershipService } from '../workspace-membership/workspace-membership.service';
import { Role, WorkspacePermission } from 'src/types';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { permission } from 'process';
@Injectable()
export class WorkspaceRoleService {
  constructor(
    @InjectModel(WorkspaceRole.name)
    private workspaceRoleModel: Model<WorkspaceRole>,
    private workspaceMembershipService: WorkspaceMembershipService,
  ) {}
  private setDefaultValues(role: string): Partial<WorkspaceRole> {
    switch (role) {
      case 'owner':
        return {
          canManage: true,
          canRemoveMembers: true,
          canDownload: true,
          canUpload: true,
          canRename: true,
          canShare: true,
          canDelete: true,
          canLock: true,
          canMove: true,
        };
      case 'manager':
        return {
          canManage: true,
          canRemoveMembers: false,
          canDownload: true,
          canUpload: true,
          canRename: true,
          canShare: true,
          canDelete: true,
          canLock: true,
          canMove: true,
        };
      case 'member':
        return {
          canManage: false,
          canRemoveMembers: false,
          canDownload: true,
          canUpload: true,
          canRename: false,
          canShare: false,
          canDelete: false,
          canLock: false,
          canMove: true,
        };
      default:
        return {
          canManage: false,
          canRemoveMembers: false,
          canDownload: true,
          canUpload: true,
          canRename: false,
          canShare: false,
          canDelete: false,
          canLock: false,
          canMove: true,
        };
    }
  }
  async create(workspaceId: string, userId: string, session?: ClientSession) {
    //트랜잭션 로직에서 에러처리하기 때문에 try-catch 사용 x
    const roles = ['owner', 'manager', 'member'].map(
      (position) =>
        new this.workspaceRoleModel({
          workspace: workspaceId,
          owner: userId,
          position,
          role: position,
          ...this.setDefaultValues(position),
        }),
    );
    return await this.workspaceRoleModel.insertMany(roles, {
      session,
    });
  }
  async update(
    workspaceId: string,
    updateData: UpdatePermissionDto[],
    session?: ClientSession,
  ) {
    const foundRole = await this.workspaceRoleModel.find({
      workspace: workspaceId,
      role: { $ne: 'owner' },
    });
    if (!foundRole) {
      throw new BadRequestException('Role not found');
    }

    const managerRole = foundRole.find((role) => role.role === 'manager');
    const managerUpdatedata = updateData.find(
      (data) => data.role === 'manager',
    );

    const memberRole = foundRole.find((role) => role.role === 'member');
    const memberUpdatedata = updateData.find((data) => data.role === 'member');
    if (
      !managerUpdatedata ||
      !memberUpdatedata ||
      !managerRole ||
      !memberRole
    ) {
      throw new BadRequestException('Role not found');
    }

    await managerRole.set(managerUpdatedata).save();
    await memberRole.set(memberUpdatedata).save();

    return {
      isSuccess: true,
    };
  }
  async findAll(workspaceId: string) {
    return await this.workspaceRoleModel
      .find({
        workspace: workspaceId,
        role: { $ne: 'owner' },
      })
      .lean();
    // if (role === 'owner') {
    //   throw new BadRequestException('owner role cannot access this api');
    // }
    // return await this.workspaceRoleModel.find({
    //   workspace: workspaceId,
    //   role: role,
    // });
  }

  // async findAuthorityByUserId(workspaceId: string, userId: string) {
  //   const myRole = await this.getMyRole(workspaceId, userId);
  //   return await this.workspaceRoleModel.findOne({
  //     role: myRole,
  //     workspace: workspaceId,
  //   });
  // }

  async getMyRole(workspaceId: string, userId: string) {
    const result = await this.workspaceMembershipService.findOne(
      userId,
      workspaceId,
    );
    return result.role;
  }

  async hasPermission(
    workspaceId: string,
    role: 'owner' | 'manager' | 'member',
    permission: WorkspacePermission,
  ) {
    const foundRoleTable = await this.workspaceRoleModel
      .findOne({
        workspace: workspaceId,
        role,
      })
      .lean();

    if (!foundRoleTable) {
      return false;
    }

    // permission이 foundRoleTable에 있는 속성인지 확인
    if (permission in foundRoleTable) {
      return foundRoleTable[permission] === true;
    }

    return false;
  }
}

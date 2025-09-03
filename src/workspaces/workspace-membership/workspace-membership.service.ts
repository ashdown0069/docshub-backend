import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ClientSession, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { WorkspaceMembership } from 'src/common/database/schemas/workspaceMembership.schema';
import { WorkspacesService } from '../workspaces.service';
import { comparePassword } from 'src/common/utils/bcrypt';
import { UsersService } from 'src/users/users.service';
import { TransactionService } from 'src/common/database/transaction/transaction.service';
import { UpdateWorkspaceMembershipDto } from './dto/update-workspace-membership.dto';

@Injectable()
export class WorkspaceMembershipService {
  constructor(
    @InjectModel(WorkspaceMembership.name)
    private workspaceMembershipModel: Model<WorkspaceMembership>,
    @Inject(forwardRef(() => WorkspacesService))
    private workspaceService: WorkspacesService,
    private userService: UsersService,
    private transactionService: TransactionService,
  ) {}
  async create(
    workspaceId: string,
    userId: string,
    role: 'owner' | 'member' | 'manager',
    session?: ClientSession,
  ) {
    const newMembership = new this.workspaceMembershipModel({
      workspace: workspaceId,
      user: userId,
      role,
    });
    return await newMembership.save({ session });
  }
  async join(workspaceId: string, userId: string, workspacePassword?: string) {
    return this.transactionService.executeInTransaction(async (session) => {
      const foundWorkspace =
        await this.workspaceService.findOneById(workspaceId);

      //이미 가입된 워크스페이스인 경우
      //비정상적 요청
      const isMember = await this.checkIsMember(workspaceId, userId);
      if (isMember) {
        throw new BadRequestException('already joined');
      }

      //비번이 필요하지만 요청에 비번이 없는경우
      if (foundWorkspace.password && !workspacePassword) {
        throw new ForbiddenException({
          message: 'password is required',
          key: 'empty',
        });
      }

      //비번이 필요없지만 요청에 비번이 있는 경우
      //비정상적 요청
      if (!foundWorkspace.password && workspacePassword) {
        throw new BadRequestException('password is not required');
      }

      //비번이 필요하고 요청에 비번이 있는 경우
      if (workspacePassword && foundWorkspace.password) {
        const hashedPassword = foundWorkspace.password;
        const result = await comparePassword(workspacePassword, hashedPassword);
        if (!result)
          throw new ForbiddenException({
            message: 'password is not correct',
            key: 'error',
          });
      }

      //정원 초과시
      if (foundWorkspace.capacity <= foundWorkspace.membersCount) {
        throw new ForbiddenException({
          message: 'out of capacity',
          key: 'capacity',
        });
      }

      //카운트 증가
      foundWorkspace.membersCount = foundWorkspace.membersCount + 1;
      await foundWorkspace.save({ session });

      //멤버 추가
      const foundUser = await this.userService.findOneById(userId);
      return await this.create(
        foundWorkspace.id,
        foundUser.id,
        'member',
        session,
      );
    });
  }
  async findAllWorkspaceMembers(workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }
    const members = await this.workspaceMembershipModel
      .find({
        workspace: workspaceId,
        isDeleted: null,
        role: { $ne: 'owner' },
      })
      .populate('user', '_id nickname email');

    if (members.length === 0) {
      return [];
    }

    return members
      .map((member: any) => ({
        _id: member.user._id,
        nickname: member.user.nickname,
        email: member.user.email,
        role: member.role,
        joinedAt: member.createdAt,
      }))
      .sort((a, b) => a.role.localeCompare(b.role));
  }

  async findAllUserJoinedWorkspaces(userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return await this.workspaceMembershipModel
      .find({
        user: userId,
        isDeleted: null,
      })
      .populate('workspace');
  }

  async checkIsMember(workspaceId: string, userId: string) {
    const result = await this.workspaceMembershipModel.findOne({
      user: userId,
      workspace: workspaceId,
      isDeleted: null,
    });
    if (!result) {
      return false;
    }
    return true;
  }

  async findOne(userId: string, workspaceId: string) {
    const result = await this.workspaceMembershipModel.findOne({
      user: userId,
      workspace: workspaceId,
      isDeleted: null,
    });
    if (!result) {
      throw new NotFoundException('workspaceMembership not found');
    }
    return result;
  }

  async update(
    userId: string,
    workspaceId: string,
    updateWorkspaceMembershipDto: UpdateWorkspaceMembershipDto,
  ) {
    //admin패널에서 권한 변경의 경우 필요
    const targetUserId = updateWorkspaceMembershipDto.targetUserId || userId;

    const foundMembership = await this.findOne(targetUserId, workspaceId);

    return await foundMembership.set(updateWorkspaceMembershipDto).save();
  }

  async withDraw(userId: string, workspaceId: string) {
    return this.transactionService.executeInTransaction(async (session) => {
      const foundWorkspace =
        await this.workspaceService.findOneById(workspaceId);

      if (foundWorkspace.owner.toString() === userId) {
        throw new ForbiddenException({
          message: 'Owner cannot withdraw, Please use the admin panel',
          key: 'iamowner',
        });
      }
      foundWorkspace.membersCount = foundWorkspace.membersCount - 1;
      await foundWorkspace.save({ session });

      const result = await this.workspaceMembershipModel.deleteOne(
        {
          user: userId,
          workspace: workspaceId,
        },
        { session },
      );

      if (result.acknowledged) {
        return {
          isSuccess: true,
        };
      }
    });
  }
}

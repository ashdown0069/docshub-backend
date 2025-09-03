import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { User, UserDocument } from 'src/common/database/schemas/users.schema';
import { Workspace } from 'src/common/database/schemas/workspace.schema';
import { UsersService } from 'src/users/users.service';
import { TransactionService } from 'src/common/database/transaction/transaction.service';
import { WorkspaceRoleService } from './workspace-role/workspace-role.service';
import { comparePassword, hashPassword } from 'src/common/utils/bcrypt';
import { WorkspaceMembershipService } from './workspace-membership/workspace-membership.service';
import { FilebrowserService } from 'src/filebrowser/filebrowser.service';
import { CreateAnnouncementsDto } from './dtos/create-announcements';
@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<Workspace>,
    private workspaceRoleService: WorkspaceRoleService,
    private userService: UsersService,
    private transactionService: TransactionService,
    @Inject(forwardRef(() => WorkspaceMembershipService))
    private workspaceMembershipService: WorkspaceMembershipService,
    private filebrowserService: FilebrowserService,
  ) {}

  async searchWorkspaces(query: string, userId: string) {
    if (!query) {
      return [];
    }

    //$regex: query,  query가 포함된 모든 워크스페이스를 찾음
    //$options: 'i', 대소문자 구분 x
    const foundWorkspaces = await this.workspaceModel.find({
      name: {
        $regex: query,
        $options: 'i',
      },
      isDeleted: null,
    });

    //검색결과에서 이미 가입한 워크스페이스 제외
    const filteredWorkspaces = [];
    for (const workspace of foundWorkspaces) {
      const isMember = await this.workspaceMembershipService.checkIsMember(
        workspace.id,
        userId,
      );

      if (!isMember) {
        filteredWorkspaces.push(workspace);
      }
    }
    // return foundWorkspaces;
    return filteredWorkspaces;
  }

  async findOneById(workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException('Workspace id is required');
    }

    const foundWorkspace = await this.workspaceModel.findOne({
      _id: workspaceId,
      isDeleted: null,
    });

    if (!foundWorkspace) {
      throw new NotFoundException('Workspace not found');
    }
    return foundWorkspace;
  }

  async findOneByName(workspaceName: string) {
    if (!workspaceName) {
      throw new BadRequestException('Workspace name is required');
    }

    const workspace = await this.workspaceModel.findOne({
      name: workspaceName,
      isDeleted: null,
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async findAll(userId: string) {
    return (
      await this.workspaceMembershipService.findAllUserJoinedWorkspaces(userId)
    ).map((w) => ({ isBookmarked: w.isBookmarked, ...w.toObject().workspace }));
  }

  async create(
    userId: string,
    name: string,
    description: string,
    password?: string,
  ) {
    return this.transactionService.executeInTransaction(async (session) => {
      const foundUser = await this.userService.findOneById(userId);
      if (!foundUser) {
        throw new NotFoundException('user not found');
      }

      if (
        !canCreateWorkspace(foundUser.createdWorkspaceCount, foundUser.plan)
      ) {
        throw new ForbiddenException('out of capacity');
      }
      const { capacity, storage } = getStorageAndCapacity(foundUser.plan);
      const hashedPassword = password ? await hashPassword(password) : null;
      const isLocked = hashedPassword ? true : false;
      const newWorkspace = await new this.workspaceModel({
        owner: foundUser.id,
        name,
        description,
        capacity: capacity,
        maxStorage: storage,
        password: hashedPassword,
        isLocked,
      }).save({ session });

      //권한테이블 생성
      await this.workspaceRoleService.create(
        newWorkspace.id,
        foundUser.id,
        session,
      );

      //멤버십 테이블 생성
      await this.workspaceMembershipService.create(
        newWorkspace.id,
        foundUser.id,
        'owner',
        session,
      );

      //파일 브라우저 생성
      await this.filebrowserService.create(newWorkspace.id, false, session);

      //유저정보에서 생성한 워크스페이스 수 증가
      await this.userService.update(
        foundUser.id,
        {
          createdWorkspaceCount: foundUser.createdWorkspaceCount + 1,
        },
        session,
      );

      return {
        isSuccess: true,
      };
    });
  }

  async Join(
    workspaceName: string,
    targetUserId: string,
    workspacePassword?: string,
  ) {
    const foundWorkspace = await this.findOneByName(workspaceName);
    if (!foundWorkspace) {
      throw new NotFoundException('workspace not found');
    }

    if (workspacePassword !== undefined && foundWorkspace.password) {
      const hashedPassword = foundWorkspace.password;
      const result = await comparePassword(workspacePassword, hashedPassword);
      if (!result) throw new ForbiddenException('password is not correct');
    }
    if (!canJoinWorkspace(0, foundWorkspace.capacity)) {
      throw new ForbiddenException('out of capacity');
    }

    const foundUser = await this.userService.findOneById(targetUserId);
    if (!foundUser) {
      throw new NotFoundException('user not found');
    }

    const newJoinedWorkspace = {
      workspace: foundWorkspace.id,
      isBookmarked: false,
    };
    const savedUser = await this.userService.update(foundUser.id, {});

    return await foundWorkspace.save();
  }

  async deleteWorkspace(
    workspaceId: string,
    userId: string,
    password?: string,
  ) {
    return this.transactionService.executeInTransaction(async (session) => {
      const foundWorkspace = await this.findOneById(workspaceId);

      if (!foundWorkspace) {
        throw new NotFoundException('workspace not found');
      }
      if (foundWorkspace.password && password) {
        const hashedPassword = foundWorkspace.password;
        const result = await comparePassword(password, hashedPassword);
        if (!result) throw new ForbiddenException('password is not correct');
      }
      //유저정보에서 참여한 워크스페이스 삭제
      //저장된 파일 삭제 로직 추가가
      //----

      foundWorkspace.isDeleted = new Date();
      await foundWorkspace.save({ session });

      return true;
    });
  }

  // async deleteWorkspaceMember(workspaceId: string, targetUserEmail: string) {
  //   return this.transactionService.executeInTransaction(async (session) => {
  //     const foundWorkspace = await this.findOneById(workspaceId);

  //     if (!foundWorkspace) {
  //       throw new NotFoundException('workspace not found');
  //     }
  //     await foundWorkspace.populate('members');
  //     foundWorkspace.members = foundWorkspace.members.filter(
  //       (member: User) => member.email !== targetUserEmail,
  //     ) as User[];

  //     await foundWorkspace.save();

  //     const foundUser = await this.userService.findOneByEmail(targetUserEmail);
  //     if (!foundUser) {
  //       throw new NotFoundException('user not found');
  //     }

  //     foundUser.joinedWorkspace = foundUser.joinedWorkspace.filter(
  //       (workspaceId) => workspaceId !== foundWorkspace.id,
  //     ) as any;

  //     await foundUser.save({ session });
  //     return true;
  //   });
  // }
  async update(
    workspaceId: string,
    attrs: Partial<Workspace>,
    session?: ClientSession,
  ) {
    const foundWorkspace = await this.findOneById(workspaceId);
    if (!foundWorkspace) {
      throw new NotFoundException('workspace not found');
    }

    // 업데이트할 속성들을 복사
    const updateAttrs = { ...attrs };

    // 패스워드가 있는 경우 해싱 처리
    if (updateAttrs.password) {
      // 빈 문자열인 경우 패스워드 제거
      if (updateAttrs.password.trim() === '') {
        updateAttrs.password = null;
        updateAttrs.isLocked = false;
      } else {
        // 패스워드 해싱
        updateAttrs.password = await hashPassword(updateAttrs.password);
        updateAttrs.isLocked = true;
      }
    } else {
      // 패스워드가 없는 경우
      updateAttrs.isLocked = false;
      updateAttrs.password = null;
    }

    // 속성 설정 및 저장
    foundWorkspace.set(updateAttrs);
    return await foundWorkspace.save({ session });
  }

  async getAnnouncements(workspaceId: string) {
    const foundWorkspace = await this.findOneById(workspaceId);

    return foundWorkspace.announcements;
  }

  //저장소 공지사항 업데이트
  async updateAnnouncements(data: CreateAnnouncementsDto) {
    const foundWorkspace = await this.findOneById(data.workspaceId);

    foundWorkspace.announcements.push({
      title: data.title,
      description: data.description,
      createdAt: new Date(),
    });
    await foundWorkspace.save();
    return {
      isSuccess: true,
    };
  }

  async updateCurrentStorage(
    workspaceId: string,
    fileSize: number,
    action: 'increase' | 'decrease',
    session?: ClientSession,
  ) {
    const foundWorkspace = await this.findOneById(workspaceId);
    if (!foundWorkspace) {
      throw new NotFoundException('workspace not found');
    }
    if (action === 'increase') {
      foundWorkspace.currentStorage += fileSize;
    } else if (action === 'decrease') {
      foundWorkspace.currentStorage -= fileSize;
    } else {
      throw new BadRequestException('action must be increase or decrease');
    }

    return await foundWorkspace.save({ session });
  }

  async updateCapacityAndStorage(user: UserDocument) {
    const { capacity, storage } = getStorageAndCapacity(user.plan);

    return await this.workspaceModel.updateMany(
      { owner: user.id },
      { capacity, maxStorage: storage },
    );
  }
}

const getStorageAndCapacity = (plan: 'free' | 'team' | 'enterprise') => {
  switch (plan) {
    case 'free':
      return {
        storage: 1024 * 1024 * 1024,
        capacity: 10,
      };
    case 'team':
      return {
        storage: 1024 * 1024 * 1024 * 100,
        capacity: 30,
      };
    case 'enterprise':
      return {
        storage: 1024 * 1024 * 1024 * 1024,
        capacity: 9999,
      };
    default:
      return {
        storage: 1024 * 1024 * 1024,
        capacity: 10,
      };
  }
};

const canCreateWorkspace = async (
  createdWorkspaceCount: number,
  plan: 'free' | 'team' | 'enterprise',
) => {
  switch (plan) {
    case 'free':
      //1개 존재시 금지
      return createdWorkspaceCount === 1 ? false : true;
    case 'team':
      //3개 존재시 금지
      return createdWorkspaceCount === 3 ? false : true;
    case 'enterprise':
      return true;
    default:
      return false;
  }
};

const canJoinWorkspace = (currentMembersCount: number, capacity: number) => {
  return currentMembersCount < capacity ? true : false;
};

import { Injectable, NotFoundException } from '@nestjs/common';
import { AddBookmarkDto } from './dto/bookmark.dto';
import { WorkspacesService } from '../../workspaces.service';
import { UsersService } from 'src/users/users.service';
import { Workspace } from 'src/common/database/schemas/workspace.schema';
import { Types } from 'mongoose';
import { WorkspaceMembership } from 'src/common/database/schemas/workspaceMembership.schema';
import { WorkspaceMembershipService } from '../workspace-membership.service';

@Injectable()
export class BookmarkService {
  constructor(
    private readonly workspaceMembershipService: WorkspaceMembershipService,
  ) {}
  async create(workspaceId: AddBookmarkDto['workspaceId'], userId: string) {
    const foundUser = await this.workspaceMembershipService.findOne(
      userId,
      workspaceId,
    );
    foundUser.isBookmarked = true;
    return await foundUser.save();
  }

  async findAll(userId: string) {
    const foundUser =
      await this.workspaceMembershipService.findAllUserJoinedWorkspaces(userId);

    return foundUser
      .filter((w) => w.isBookmarked == true)
      .map((w) => w.workspace);
  }

  findOne(workspaceId: AddBookmarkDto['workspaceId']) {
    return;
  }

  async remove(workspaceId: AddBookmarkDto['workspaceId'], userId: string) {
    const foundUser = await this.workspaceMembershipService.findOne(
      userId,
      workspaceId,
    );

    foundUser.isBookmarked = false;
    await foundUser.save();
    return {
      isSuccess: true,
    };
  }
}

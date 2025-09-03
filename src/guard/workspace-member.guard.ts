import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WorkspaceMembershipService } from 'src/workspaces/workspace-membership/workspace-membership.service';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(
    private readonly workspaceMembershipService: WorkspaceMembershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const workspaceId = request.params.workspaceId;
    const userId = request.user._id;

    return await this.workspaceMembershipService.checkIsMember(
      workspaceId,
      userId,
    );
  }
}

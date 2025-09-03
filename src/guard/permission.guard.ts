import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JWT_User } from 'src/types/authPayload';
import { WorkspaceRoleService } from 'src/workspaces/workspace-role/workspace-role.service';

export function PermissionGuard(
  action:
    | 'canDownload'
    | 'canUpload'
    | 'canRename'
    | 'canDelete'
    | 'canLock'
    | 'canMove'
    | 'canRemoveMembers',
) {
  @Injectable()
  class PermissionGuard implements CanActivate {
    #workspaceRoleService: WorkspaceRoleService;
    constructor(workspaceRoleService: WorkspaceRoleService) {
      this.#workspaceRoleService = workspaceRoleService;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const workspaceId = request.params.workspaceId;
      const user = request.user as JWT_User;

      // 사용자의 워크스페이스 role 가져오기
      const userRole = await this.#workspaceRoleService.getMyRole(
        workspaceId,
        user.id,
      );

      return await this.#workspaceRoleService.hasPermission(
        workspaceId,
        userRole,
        action,
      );
    }
  }

  return PermissionGuard;
}

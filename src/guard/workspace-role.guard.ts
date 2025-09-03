import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WorkspaceRoleService } from 'src/workspaces/workspace-role/workspace-role.service';
import { JWT_User } from 'src/types/authPayload';

export function WorkspaceRoleGuard(
  requiredRole: 'owner' | 'manager' | 'member',
) {
  @Injectable()
  class RoleGuardClass implements CanActivate {
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

      // owner는 모든 권한 가짐
      if (userRole === 'owner') return true;

      // manager는 member 권한도 가짐
      if (userRole === 'manager' && requiredRole === 'member') return true;

      // 그 외에는 정확히 일치하는 role만 허용
      return userRole === requiredRole;
    }
  }

  return RoleGuardClass;
}

import { Module } from '@nestjs/common';
import { WorkspaceRoleController } from './workspace-role.controller';
import { WorkspaceRoleService } from './workspace-role.service';
import { WorkspaceMembershipService } from '../workspace-membership/workspace-membership.service';
import { WorkspaceMembershipModule } from '../workspace-membership/workspace-membership.module';

@Module({
  imports: [WorkspaceMembershipModule],
  controllers: [WorkspaceRoleController],
  providers: [WorkspaceRoleService],
  exports: [WorkspaceRoleService],
})
export class WorkspaceRoleModule {}

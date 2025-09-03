import { forwardRef, Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceRoleService } from './workspace-role/workspace-role.service';
import { WorkspaceMembershipModule } from './workspace-membership/workspace-membership.module';
import { UsersModule } from 'src/users/users.module';
import { FilebrowserService } from 'src/filebrowser/filebrowser.service';
import { WorkspaceRoleModule } from './workspace-role/workspace-role.module';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => WorkspaceMembershipModule),
    WorkspaceRoleModule,
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, FilebrowserService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}

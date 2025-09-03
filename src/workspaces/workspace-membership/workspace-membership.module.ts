import { forwardRef, Module } from '@nestjs/common';
import { WorkspaceMembershipService } from './workspace-membership.service';
import { WorkspaceMembershipController } from './workspace-membership.controller';
import { WorkspacesModule } from '../workspaces.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule, forwardRef(() => WorkspacesModule)],
  controllers: [WorkspaceMembershipController],
  providers: [WorkspaceMembershipService],
  exports: [WorkspaceMembershipService],
})
export class WorkspaceMembershipModule {}

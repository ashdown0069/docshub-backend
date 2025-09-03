import { Module } from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { BookmarkController } from './bookmark.controller';
import { WorkspaceMembershipModule } from '../workspace-membership.module';

@Module({
  imports: [WorkspaceMembershipModule],
  controllers: [BookmarkController],
  providers: [BookmarkService],
})
export class BookmarkModule {}

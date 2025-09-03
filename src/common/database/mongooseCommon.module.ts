import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import {
  WorkspaceRole,
  WorkspaceRoleSchema,
} from './schemas/workspace-role.schema';
import { User, UserSchema } from './schemas/users.schema';
import { TransactionService } from './transaction/transaction.service';
import {
  WorkspaceMembership,
  WorkspaceMembershipSchema,
} from './schemas/workspaceMembership.schema';
import { FileBrowser, FileBrowserSchema } from './schemas/file-browser.schema';
import {
  FileBrowserDownloadRecord,
  FileBrowserDownloadRecordSchema,
} from './schemas/file-browser-record';
import { BrowserItemSchema, Item } from './schemas/file-browser-item.schema';
@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: WorkspaceRole.name, schema: WorkspaceRoleSchema },
      {
        name: User.name,
        schema: UserSchema,
      },
      { name: WorkspaceMembership.name, schema: WorkspaceMembershipSchema },
      { name: FileBrowser.name, schema: FileBrowserSchema },
      { name: Item.name, schema: BrowserItemSchema },
      {
        name: FileBrowserDownloadRecord.name,
        schema: FileBrowserDownloadRecordSchema,
      },
    ]),
  ],
  providers: [TransactionService],
  exports: [MongooseModule, TransactionService],
})
export class MongooseCommonModule {}

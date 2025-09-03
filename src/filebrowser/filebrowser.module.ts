import { Module } from '@nestjs/common';
import { Filebrowser_File_Controller } from './filebrowser-file.controller';
import { WorkspacesModule } from 'src/workspaces/workspaces.module';
import { Filebrowser_File_Service } from './filebrowser-file.service';
import { Filebrowser_Folder_Service } from './filebrowser-folder.service';
import { Filebrowser_Folder_Controller } from './filebrowser-folder.controller';
import { FilebrowserService } from './filebrowser.service';
import { FilebrowserController } from './filebrowser.controller';
import { Filebrowser_Common_Controller } from './filebrowser-common.controller';
import { Filebrowser_Common_Service } from './filebrowser-common.service';
import { WorkspaceRoleModule } from 'src/workspaces/workspace-role/workspace-role.module';

@Module({
  imports: [WorkspacesModule, WorkspaceRoleModule],
  controllers: [
    FilebrowserController,
    Filebrowser_File_Controller,
    Filebrowser_Folder_Controller,
    Filebrowser_Common_Controller,
  ],
  providers: [
    FilebrowserService,
    Filebrowser_File_Service,
    Filebrowser_Folder_Service,
    Filebrowser_Common_Service,
  ],
})
export class FilebrowserModule {}

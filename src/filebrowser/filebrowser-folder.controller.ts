import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { getWorkspaceId } from './decorators/getWorkspaceId.decorator';
import { FilebrowserService } from './filebrowser.service';
import { Filebrowser_Folder_Service } from './filebrowser-folder.service';
import { CreateFolderDto } from './dtos/create-folder.dto';

@Controller(':workspaceId/filebrowser/folder')
@UseGuards(JwtAuthGuard)
export class Filebrowser_Folder_Controller {
  constructor(private filebrowserFolderService: Filebrowser_Folder_Service) {}

  @Get()
  async openFolder(
    @Param('workspaceId') workspaceId: string,
    @Query('folderId') folderId: string,
  ) {
    const parseFolderId = folderId === 'null' ? null : folderId;
    const result = await this.filebrowserFolderService.findOneFolder(
      workspaceId,
      parseFolderId,
    );
    return result;
  }
  @Post()
  async createFolder(
    @Param('workspaceId') workspaceId: string,
    @Body() body: CreateFolderDto,
  ) {
    return await this.filebrowserFolderService.createFolder(
      workspaceId,
      body.folderName,
      body.parentId,
    );
  }

  // @Patch('/:folderId')
  // async renameFolder(
  //   @Param('workspaceId') workspaceId: string,
  //   @Param('folderId') folderId: string,
  //   @Body() body: { newName: string },
  // ) {
  //   return await this.filebrowserFolderService.renameFolder(
  //     workspaceId,
  //     folderId,
  //     body.newName,
  //   );
  // }

  //breadcrumb에서 사용
  @Get('/ancestors/:folderId')
  async getAncestors(
    @Param('workspaceId') workspaceId: string,
    @Param('folderId') folderId: string,
  ) {
    const parseFolderId = folderId === 'null' ? null : folderId;
    const result = await this.filebrowserFolderService.getAncestors(
      workspaceId,
      parseFolderId,
    );

    return result;
  }

  //폴더나 파일 이동을 위한 모달창에서 사용
  @Post('/tree')
  async getFolderTree(
    @Body('workspaceId') workspaceId: string,
    @Body('selectedItems') selectedItems: string[],
  ) {
    const result = await this.filebrowserFolderService.getFolderTree(
      workspaceId,
      selectedItems,
    );
    return result;
  }
}

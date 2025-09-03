import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { MoveItemsDto } from './dtos/move-items.dto';
import { Filebrowser_Common_Service } from './filebrowser-common.service';
import { DeleteItemsDto } from './dtos/delete-items.dto';
import { UpdateItemDto } from './dtos/update-item.dto';
import { PermissionGuard } from 'src/guard/permission.guard';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';

@Controller(':workspaceId/filebrowser/common')
@UseGuards(JwtAuthGuard)
export class Filebrowser_Common_Controller {
  constructor(private filebrowserCommonService: Filebrowser_Common_Service) {}

  @UseGuards(PermissionGuard('canMove'))
  @Patch()
  async moveItems(
    @Param('workspaceId') workspaceId: string,
    @Body() body: MoveItemsDto,
  ) {
    return await this.filebrowserCommonService.moveItems(
      workspaceId,
      body.sourceIds,
      body.targetId,
    );
  }

  @UseGuards(PermissionGuard('canRename'))
  @Patch(':itemId')
  async renameItem(
    @Param('workspaceId') workspaceId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateItemDto,
  ) {
    return await this.filebrowserCommonService.renameItem(
      workspaceId,
      itemId,
      body.name,
    );
  }

  @UseGuards(PermissionGuard('canDelete'))
  @Delete()
  async deleteItems(
    @Param('workspaceId') workspaceId: string,
    @Body() body: DeleteItemsDto,
  ) {
    return await this.filebrowserCommonService.deleteItems(
      workspaceId,
      body.folderIds,
    );
  }

  // @Get(':id')
  // async getFileById(@Param('id') id: string) {
  //     return `Get file with id: ${id}`;
  // }

  // @Post()
  // async createFile(@Body() fileData: any) {
  //     return 'Create file';
  // }

  // @Put(':id')
  // async updateFile(@Param('id') id: string, @Body() fileData: any) {
  //     return `Update file with id: ${id}`;
  // }

  // @Delete(':id')
  // async deleteFile(@Param('id') id: string) {
  //     return `Delete file with id: ${id}`;
  // }
}

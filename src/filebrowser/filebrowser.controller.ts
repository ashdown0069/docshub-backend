import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FilebrowserService } from './filebrowser.service';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { RecentUploadDto } from './dtos/recentupload.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';

@Controller(':workspaceId/filebrowser')
@UseGuards(JwtAuthGuard)
export class FilebrowserController {
  constructor(private filebrowserService: FilebrowserService) {}
  @Serialize(RecentUploadDto)
  @Get('/recentupload')
  async getRecentUploadFileList(@Param('workspaceId') workspaceId: string) {
    return await this.filebrowserService.getRecentUploadFileList(workspaceId);
  }

  @Get('/deletedfiles')
  async getDeletedFileList(@Param('workspaceId') workspaceId: string) {
    return await this.filebrowserService.getDeletedFileList(workspaceId);
  }

  @Get('/downloadrecords')
  async getDownloadRecords(@Param('workspaceId') workspaceId: string) {
    return await this.filebrowserService.getDownloadRecords(workspaceId);
  }

  @Get('/search')
  async searchFiles(
    @Param('workspaceId') workspaceId: string,
    @Query('query') query: string,
  ) {
    return await this.filebrowserService.searchFiles(workspaceId, query);
  }

  @Get('/advancedsearch')
  async advancedSearchFiles(
    @Param('workspaceId') workspaceId: string,
    @Query('fileName') fileName: string,
    @Query('contents') contents: string,
    @Query('extension')
    extension: ('txt' | 'pdf' | 'doc' | 'ppt' | 'xlsx')[],
  ) {
    return await this.filebrowserService.AdvancedSearchFiles(
      workspaceId,
      fileName,
      contents,
      extension,
    );
  }
  @Post()
  async createBrowser(@Param('workspaceId') workspaceId: string) {
    return await this.filebrowserService.create(workspaceId, false);
  }

  @Patch()
  async updateBrowser(@Param('workspaceId') workspaceId: string) {}
}

import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  InternalServerErrorException,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { Filebrowser_File_Service } from './filebrowser-file.service';
import { getFileValidator } from './file-validator';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { JWT_User } from 'src/types/authPayload';
import { PermissionGuard } from 'src/guard/permission.guard';

@Controller(':workspaceId/filebrowser/file')
@UseGuards(JwtAuthGuard)
export class Filebrowser_File_Controller {
  constructor(private filebrowserFileService: Filebrowser_File_Service) {}

  @UseGuards(PermissionGuard('canDownload'))
  @Get('/:fileId')
  async downloadFile(
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const { id: userId } = req.user as JWT_User;
      const { stream, filename, mimetype } =
        await this.filebrowserFileService.downloadFile(
          workspaceId,
          fileId,
          userId,
        );

      res.setHeader('Content-Type', mimetype);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      );
      return stream.pipe(res);
    } catch (error) {
      // 에러 핸들링
      if (error instanceof NotFoundException) {
        throw new NotFoundException('File not found');
      }
      throw new InternalServerErrorException('Error downloading file');
    }
  }

  @UseGuards(PermissionGuard('canUpload'))
  @UseInterceptors(FilesInterceptor('files'))
  @Post()
  async uploadFile(
    @Req() req: Request,
    @Param('workspaceId') workspaceId: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body('folderId') folderId: string,
    // @UploadedFiles(getFileValidator())
    // files: Express.Multer.File[],
  ) {
    const { id: userId } = req.user as JWT_User;
    const parsedFolderId = folderId === 'null' ? null : folderId;
    return await this.filebrowserFileService.createFiles(
      workspaceId,
      files,
      parsedFolderId,
      userId,
    );
  }

  @Patch('/restore')
  async restoreFile(
    @Param('workspaceId') workspaceId: string,
    @Body('fileId') fileId: string,
  ) {
    return await this.filebrowserFileService.restoreFile(workspaceId, fileId);
  }

  @Post('/lock')
  async lockFile(
    @Param('workspaceId') workspaceId: string,
    @Body('fileId') fileId: string,
  ) {
    return await this.filebrowserFileService.lockFile(workspaceId, fileId);
  }

  @Post('/unlock')
  async unlockFile(
    @Param('workspaceId') workspaceId: string,
    @Body('fileId') fileId: string,
  ) {
    return await this.filebrowserFileService.unlockFile(workspaceId, fileId);
  }
}

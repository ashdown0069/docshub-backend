import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  FileBrowser,
  FileBrowserDocument,
} from 'src/common/database/schemas/file-browser.schema';
import { WorkspacesService } from 'src/workspaces/workspaces.service';
import { FilebrowserService } from './filebrowser.service';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { Item } from 'src/common/database/schemas/file-browser-item.schema';
import { TransactionService } from 'src/common/database/transaction/transaction.service';
import { CreateFolderDto } from './dtos/create-folder.dto';
import * as mime from 'mime';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);

@Injectable()
export class Filebrowser_File_Service {
  constructor(
    private filebrowserService: FilebrowserService,
    private transactionService: TransactionService,
    private workspacesService: WorkspacesService,
  ) {}

  private async createUploadDir(workspaceId: string) {
    //폴더가 이미 존재한다면 경로 반환함
    const uploadDir = path.join(process.cwd(), 'uploads', workspaceId);
    await mkdir(uploadDir, { recursive: true });
    return uploadDir;
  }
  private generateShortUUID = async () => {
    const { nanoid } = await import('nanoid');
    return nanoid(5);
  };

  private async uploadFile(workspaceId: string, file: Express.Multer.File) {
    let FILE_PATH = '';
    try {
      const uploadDir = await this.createUploadDir(workspaceId);
      const fileName = file.originalname;
      const fileSize = file.size;
      const filePath = path.join(uploadDir, fileName);
      FILE_PATH = filePath;
      await writeFile(filePath, file.buffer);

      return {
        filePath,
        fileName,
        fileExtension: path.extname(file.originalname).slice(1),
        fileSize,
      };
    } catch (error) {
      await this.deleteUploadedFile(FILE_PATH);
      return null;
    }
  }

  private async deleteUploadedFile(filepath: string) {
    if (filepath) await unlink(filepath);
  }

  async createFiles(
    workspaceId: string,
    files: Express.Multer.File[],
    parentId: string | null,
    uploaderId: string,
  ) {
    return await this.transactionService.executeInTransaction(
      async (session) => {
        const foundBrowser = await this.filebrowserService.findOne(workspaceId);
        let totalFileSize = 0;
        //parentId 유효성 검사
        if (parentId) {
          const parentFolder = foundBrowser.browser.find(
            (item) => item._id.toString() === parentId && !item.isDeleted,
          );
          if (!parentFolder || parentFolder.itemType !== 'Folder') {
            throw new BadRequestException('Invalid parent folder');
          }
        }

        // 파일 이름 중복 확인 및 중복인 경우 새 이름 생성
        for (const file of files) {
          //파일 이름 한글인 경우를 위해
          const decodedFileName = Buffer.from(
            file.originalname,
            'latin1',
          ).toString('utf8');
          let newFileName = decodedFileName;
          while (
            foundBrowser.browser.some(
              (item) =>
                (parentId
                  ? item.parentId?.toString() === parentId
                  : parentId == null) &&
                item.name === newFileName &&
                !item.isDeleted,
            )
          ) {
            const shortId = await this.generateShortUUID();
            const nameWithoutExt = path.parse(newFileName).name;
            const ext = path.parse(newFileName).ext;
            newFileName = `${nameWithoutExt}-${shortId}${ext}`;
          }
          // 수정된 이름으로 파일 업로드
          const uploadResult = await this.uploadFile(workspaceId, {
            ...file,
            originalname: newFileName,
          });

          if (!uploadResult) {
            throw new BadRequestException(`File upload failed: ${newFileName}`);
          }

          // 파일 정보 생성
          const parentFolder = parentId
            ? foundBrowser.browser.find(
                (item) => item._id.toString() === parentId,
              )
            : null;

          const newPath = parentFolder
            ? `${parentFolder.path}/${uploadResult.fileName}`
            : `/${uploadResult.fileName}`;
          const newDepth = parentFolder ? parentFolder.depth + 1 : 1;
          const newParentId = parentId ? new Types.ObjectId(parentId) : null;
          foundBrowser.browser.push({
            name: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            fileExtension: uploadResult.fileExtension,
            src: uploadResult.filePath,
            itemType: 'File',
            uploader: new Types.ObjectId(uploaderId),
            parentId: newParentId,
            isDeleted: null,
            path: newPath,
            isLocked: false,
            depth: newDepth,
          });
          // 용량 업데이트
          totalFileSize += uploadResult.fileSize;
        }

        await this.workspacesService.updateCurrentStorage(
          workspaceId,
          totalFileSize,
          'increase',
          session,
        );
        await foundBrowser.save({ session });
        return {
          isSuccess: true,
        };
      },
    );
  }

  async downloadFile(workspaceId: string, fileId: string, userId: string) {
    const foundBrowser = await this.filebrowserService.findOne(workspaceId);

    const fileItem = foundBrowser.browser.find(
      (item) => item._id.toString() === fileId && !item.isDeleted,
    );

    if (!fileItem || fileItem.itemType !== 'File') {
      throw new NotFoundException('File not found');
    }

    // 다운로드 기록 추가 (옵션)
    if (foundBrowser.enableDownloadRecord) {
      const result = await this.filebrowserService.addDownloadRecord(
        workspaceId,
        fileId,
        fileItem.name,
        userId,
      );
    }

    if (!fileItem.src) throw new InternalServerErrorException('File not found');
    try {
      const fileStream = fs.createReadStream(fileItem.src);
      return {
        stream: fileStream,
        filename: fileItem.name,
        mimetype: mime.lookup(fileItem.src) || 'application/octet-stream',
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to read file');
    }
  }

  async restoreFile(workspaceId: string, fileId: string) {
    return await this.transactionService.executeInTransaction(
      async (session) => {
        const foundBrowser = await this.filebrowserService.findOne(workspaceId);

        const foundFile = foundBrowser.browser.find(
          (item) => item._id.toString() == fileId && item.isDeleted,
        );

        if (!foundFile) {
          throw new NotFoundException('File not found');
        }

        foundFile.isDeleted = null;
        foundFile.parentId = null;
        foundFile.path = `/${foundFile.name}`;
        foundFile.depth = 1;
        foundFile.isLocked = false;
        await foundBrowser.save({ session });

        await this.workspacesService.updateCurrentStorage(
          workspaceId,
          foundFile.fileSize,
          'increase',
          session,
        );

        return { isSuccess: true };
      },
    );
  }

  async lockFile(workspaceId: string, fileId: string) {
    const foundBrowser = await this.filebrowserService.findOne(workspaceId);

    const foundFile = foundBrowser.browser.find(
      (item) => item._id.toString() === fileId && !item.isDeleted,
    );

    if (!foundFile) {
      throw new NotFoundException('File not found');
    }

    foundFile.isLocked = true;
    await foundBrowser.save();
    return true;
  }

  async unlockFile(workspaceId: string, fileId: string) {
    const foundBrowser = await this.filebrowserService.findOne(workspaceId);

    const foundFile = foundBrowser.browser.find(
      (item) => item._id.toString() === fileId && !item.isDeleted,
    );
    if (!foundFile) {
      throw new NotFoundException('File not found');
    }
    if (!foundFile.isLocked) {
      throw new BadRequestException('File is not locked');
    }

    foundFile.isLocked = false;
    await foundBrowser.save();
    return true;
  }
}

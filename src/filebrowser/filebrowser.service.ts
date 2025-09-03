import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Item } from 'src/common/database/schemas/file-browser-item.schema';
import {
  FileBrowser,
  FileBrowserDocument,
} from 'src/common/database/schemas/file-browser.schema';
import { readFile } from 'fs/promises';
import { getTextExtractor } from 'office-text-extractor';
@Injectable()
export class FilebrowserService {
  constructor(
    @InjectModel(FileBrowser.name)
    private fileBrowserModel: Model<FileBrowserDocument>,
  ) {}

  async create(
    workspaceId: string,
    enableDownloadRecord: boolean,
    session?: ClientSession,
  ) {
    const newFileBrowser = new this.fileBrowserModel({
      workspace: workspaceId,
      enableDownloadRecord,
    });
    return await newFileBrowser.save({ session });
  }

  async findOne(workspaceId: string) {
    const foundBrowser = await this.fileBrowserModel.findOne({
      workspace: workspaceId,
    });
    if (!foundBrowser) {
      throw new NotFoundException('Browser not found');
    }
    return foundBrowser;
  }

  async update(workspaceId: string, enableDownloadRecord: boolean) {
    const foundBrowser = await this.fileBrowserModel.findOne({
      workspace: workspaceId,
    });
    if (!foundBrowser) {
      throw new NotFoundException('Browser not found');
    }
    foundBrowser.enableDownloadRecord = enableDownloadRecord;
    return await foundBrowser.save();
  }

  async getRecentUploadFileList(workspaceId: string) {
    const foundBrowser = await this.findOne(workspaceId);
    const recentUploadList = foundBrowser.browser
      .filter((item) => item.itemType === 'File' && !item.isDeleted)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return recentUploadList;
  }

  async getDeletedFileList(workspaceId: string) {
    const foundBrowser = await this.findOne(workspaceId);
    return foundBrowser.browser.filter((item) => item.isDeleted);
  }

  async addDownloadRecord(
    workspaceId: string,
    fileId: string,
    fileName: string,
    userId: string,
    session?: ClientSession,
  ) {
    const foundBrowser = await this.fileBrowserModel.findOne({
      workspace: workspaceId,
    });
    if (!foundBrowser) {
      throw new NotFoundException('Browser not found');
    }
    const newFileId = new Types.ObjectId(fileId);
    const newDownloaderId = new Types.ObjectId(userId);
    foundBrowser.downloadRecord.push({
      fileId: newFileId,
      name: fileName,
      downloader: newDownloaderId,
    });
    return await foundBrowser.save({ session });
  }

  async getDownloadRecords(workspaceId: string) {
    const foundBrowser = await this.findOne(workspaceId);
    await foundBrowser.populate('downloadRecord.downloader');

    return foundBrowser.downloadRecord.map((record) => {
      return {
        fileId: record.fileId,
        name: record.name,
        //@ts-ignore
        downloader: record.downloader.email,
        //@ts-ignore
        nickname: record.downloader.nickname,
        //@ts-ignore
        createdAt: record.createdAt,
      };
    });
  }

  hasDuplicateName(filebrowser: Item[], name: string, parentId: string | null) {
    return filebrowser.some(
      (item) =>
        item.name === name &&
        item.isDeleted === null &&
        (item.parentId == null
          ? parentId == null
          : item.parentId.toString() === parentId),
    );
  }
  async searchFiles(workspaceId: string, query: string) {
    if (!query) {
      return [];
    }
    const foundBrowser = await this.findOne(workspaceId);
    const searchResults = foundBrowser.browser.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) &&
        !item.isDeleted,
    );
    return searchResults;
  }

  async AdvancedSearchFiles(
    workspaceId: string,
    fileName: string,
    contents: string,
    extension: ('txt' | 'pdf' | 'doc' | 'ppt' | 'xlsx')[],
  ) {
    const foundBrowser = await this.findOne(workspaceId);

    // 1. 필수 조건인 확장자로 기본 필터링
    if (!extension || extension.length === 0) {
      return [];
    }
    let candidateFiles = foundBrowser.browser.filter(
      (item) =>
        item.itemType === 'File' &&
        !item.isDeleted &&
        extension.includes(item.fileExtension as any),
    );
    // 2. 파일 이름으로 추가 필터링
    if (fileName) {
      candidateFiles = candidateFiles.filter((item) =>
        item.name.includes(fileName),
      );
    }

    // 3. 파일 내용으로 추가 필터링
    if (contents) {
      const extractor = getTextExtractor();
      const results = [];
      for (const file of candidateFiles) {
        try {
          const text = await extractor.extractText({
            input: file.src || '',
            type: 'file',
          });
          if (text.includes(contents)) {
            let subString = '';
            const foundIndex = text.indexOf(contents);
            if (foundIndex !== -1) {
              const start = Math.max(0, foundIndex - 20);
              const end = Math.min(
                text.length,
                foundIndex + contents.length + 20,
              );
              subString = `...${text.substring(start, end)}...`.replace(
                /\n|\r|=|-/g,
                ' ',
              );
            }
            results.push({ ...file.toObject(), subString });
          }
        } catch (error) {
          console.error(`Error extracting text from ${file.name}:`, error);
        }
      }

      return results;
    }

    // 내용 검색 조건이 없으면, 파일 이름과 확장자로 필터링된 결과 반환
    return candidateFiles.map((file) => file.toObject());
  }
}

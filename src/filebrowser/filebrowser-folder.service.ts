import {
  BadRequestException,
  Injectable,
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
import { Item } from 'src/common/database/schemas/file-browser-item.schema';
import { TransactionService } from 'src/common/database/transaction/transaction.service';

@Injectable()
export class Filebrowser_Folder_Service {
  constructor(
    private fileBrowserservice: FilebrowserService,
    private transactionService: TransactionService,
  ) {}

  async getFolderTree(workspaceId: string, selectedItems: string[]) {
    const foundBrowser = await this.fileBrowserservice.findOne(workspaceId);
    const selectedItemsPath = foundBrowser.browser
      .filter(
        (item) =>
          item.isDeleted == null && selectedItems.includes(item._id.toString()),
      )
      .map((item) => item.path);
    //선택된 폴더는 필터링 후 정렬
    const sortedFolders = foundBrowser.browser
      .filter((item) => {
        // 1. 폴더이고 삭제되지 않은 항목만 선택
        if (item.itemType !== 'Folder' || item.isDeleted !== null) {
          return false;
        }

        // 2. 선택된 아이템이면 제외
        if (selectedItems.includes(item._id.toString())) {
          return false;
        }

        // 3. 선택된 아이템의 하위 경로면 제외
        for (const selectedPath of selectedItemsPath) {
          // + '/'로 시작하는 경우는 하위 경로
          if (
            selectedPath === '/' ||
            item.path.startsWith(selectedPath + '/')
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // path 기준 정렬
        const pathCompare = a.path.localeCompare(b.path);
        if (pathCompare !== 0) return pathCompare;

        // path가 같으면 depth 기준 정렬
        return a.depth - b.depth;
      });

    return sortedFolders;
  }

  async getAncestors(workspaceId: string, folderId: string | null) {
    if (!folderId) {
      // null인 경우, 최상위 폴더
      return [];
    }
    const foundBrowser = await this.fileBrowserservice.findOne(workspaceId);

    const folderItem = foundBrowser.browser.find(
      (item) => item._id.toString() === folderId && !item.isDeleted,
    );

    if (!folderItem) {
      throw new NotFoundException('Folder not found or already deleted');
    }
    const ancestors = [{ id: folderItem.id, name: folderItem.name }];
    let currentFolder = folderItem;

    while (currentFolder.parentId) {
      const parentFolder = foundBrowser.browser.find(
        (item) =>
          item._id.toString() === (currentFolder.parentId?.toString() ?? '') &&
          !item.isDeleted,
      );

      if (!parentFolder) {
        break;
      }

      ancestors.push({ id: parentFolder.id, name: parentFolder.name });
      currentFolder = parentFolder;
    }

    //뒤집어야 browser에서 breadcrumb 순서대로 나옴
    return ancestors.reverse();
  }

  async createFolder(
    workspaceId: string,
    folderName: string,
    parentId: string | null,
  ) {
    const foundBrowser = await this.fileBrowserservice.findOne(workspaceId);

    const hasDuplicateName = this.fileBrowserservice.hasDuplicateName(
      foundBrowser.browser,
      folderName,
      parentId,
    );
    if (hasDuplicateName) {
      throw new BadRequestException({
        message: 'Folder name already exists',
        key: 'duplicate',
      });
    }

    let parentPath = '/';
    let parentDepth = 0;

    if (parentId) {
      const parentItem = foundBrowser.browser.find(
        (item) => item._id.toString() === parentId,
      );
      if (!parentItem) {
        throw new BadRequestException({
          message: 'invalid parent id',
          key: 'undefined',
        });
      }
      parentPath = parentItem.path;
      parentDepth = parentItem.depth;
    }
    const newPath =
      parentPath === '/' ? `/${folderName}` : `${parentPath}/${folderName}`;
    const newDepth = parentDepth + 1;
    const newParentId = parentId ? new Types.ObjectId(parentId) : null;
    const newFolder = {
      name: folderName,
      path: newPath,
      depth: newDepth,
      isDeleted: null,
      itemType: 'Folder',
      parentId: newParentId,
      fileSize: 0,
    } as Pick<
      Item,
      | 'depth'
      | 'itemType'
      | 'name'
      | 'path'
      | 'parentId'
      | 'isDeleted'
      | 'fileSize'
    >;

    foundBrowser.browser.push(newFolder);
    const result = await foundBrowser.save();
    return result.browser.find((item) => item.name === folderName);
  }

  async findOneFolder(workspaceId: string, folderId: string | null) {
    const foundBrowser = await this.fileBrowserservice.findOne(workspaceId);
    if (folderId == null) {
      return foundBrowser.browser.filter(
        (item) => item.parentId == null && !item.isDeleted,
      );
    }

    return foundBrowser.browser.filter(
      (item) =>
        item.parentId !== null &&
        !item.isDeleted &&
        item.parentId.toString() === folderId,
    );
  }

  async moveFolder(
    workspaceId: string,
    sourceIds: string[],
    targetId: string | null,
    session?: ClientSession,
  ) {
    if (targetId && sourceIds.includes(targetId)) {
      throw new BadRequestException('Cannot move folder into itself');
    }
    const foundBrowser = await this.fileBrowserservice.findOne(workspaceId);

    // 1. 대상 폴더 확인
    let targetItem = null;
    if (targetId) {
      if (sourceIds.includes(targetId)) {
        throw new BadRequestException('Cannot move folder into itself');
      }
      targetItem = foundBrowser.browser.find(
        (item) => item._id.toString() === targetId && !item.isDeleted,
      );
      if (!targetItem) {
        throw new BadRequestException('Invalid target folder');
      }
      if (targetItem.itemType !== 'Folder') {
        throw new BadRequestException('Target must be a folder');
      }
    }

    const updateItems = new Set<string>();

    // 2. 하위 항목 이동 함수
    const moveChildren = (
      parentId: string | null,
      newParentPath: string,
      newDepth: number,
    ) => {
      const children = foundBrowser.browser.filter((item) => {
        if (item.isDeleted) return false;
        if (parentId === null) {
          return item.parentId === null;
        }
        return item.parentId && item.parentId.toString() === parentId;
      });

      for (const child of children) {
        if (updateItems.has(child._id.toString())) continue;

        child.path = `${newParentPath}/${child.name}`;
        child.depth = newDepth;
        updateItems.add(child._id.toString());

        if (child.itemType === 'Folder') {
          moveChildren(child._id.toString(), child.path, child.depth + 1);
        }
      }
    };

    // 3. 각 소스 폴더 처리
    for (const sourceId of sourceIds) {
      const sourceItem = foundBrowser.browser.find(
        (item) => item._id.toString() === sourceId && !item.isDeleted,
      );
      if (!sourceItem) {
        throw new BadRequestException(`Source folder ${sourceId} not found`);
      }

      sourceItem.parentId = targetId ? new Types.ObjectId(targetId) : null;
      sourceItem.path = targetItem
        ? `${targetItem.path}/${sourceItem.name}`
        : `/${sourceItem.name}`;
      sourceItem.depth = targetItem ? targetItem.depth + 1 : 0;

      moveChildren(sourceId, sourceItem.path, sourceItem.depth + 1);
    }

    // 4. 변경사항 저장
    const result = await foundBrowser.save({ session });
    return result;
  }

  async deleteFolder(workspaceId: string, folderIds: string[]) {
    return await this.transactionService.executeInTransaction(
      async (session) => {
        //1. 브라우저 찾기
        const foundBrowser = await this.fileBrowserservice.findOne(workspaceId);
        folderIds.forEach((folderId) => {
          //2. 폴더 찾기 및 유효성검사사
          const folderItem = foundBrowser.browser.find(
            (item) => item._id.toString() === folderId && !item.isDeleted,
          );

          if (!folderItem) {
            throw new NotFoundException('Folder not found or already deleted');
          }

          if (folderItem.itemType !== 'Folder') {
            throw new BadRequestException('Selected item is not a folder');
          }

          const currentDate = new Date();
          folderItem.isDeleted = currentDate;

          //3. 하위 항목 삭제 함수
          const deleteChildren = (parentId: string) => {
            foundBrowser.browser.forEach((item) => {
              if (
                item.parentId &&
                item.parentId.toString() === parentId &&
                !item.isDeleted
              ) {
                item.isDeleted = currentDate;
                deleteChildren(item._id.toString());
              }
            });
          };

          //4. 하위 항목들 삭제 처리
          deleteChildren(folderId);
        });

        const result = await foundBrowser.save({ session });
        return {
          isSuccess: true,
        };
      },
    );
  }

  async renameFolder(workspaceId: string, folderId: string, newName: string) {
    const foundBrowser = await this.fileBrowserservice.findOne(workspaceId);

    // 1. 폴더 찾기 및 유효성 검사
    const folderItem = foundBrowser.browser.find(
      (item) => item._id.toString() === folderId && !item.isDeleted,
    );

    if (!folderItem) {
      throw new NotFoundException('Folder not found or already deleted');
    }

    if (folderItem.itemType !== 'Folder') {
      throw new BadRequestException('Selected item is not a folder');
    }

    // 2. 중복 이름 검사
    const hasDuplicateName = foundBrowser.browser.some(
      (item) =>
        item._id.toString() !== folderId &&
        item.parentId?.toString() === folderItem.parentId?.toString() &&
        item.name === newName &&
        !item.isDeleted,
    );

    if (hasDuplicateName) {
      throw new BadRequestException('Folder name already exists');
    }

    // 3. 경로 업데이트
    const oldPath = folderItem.path;
    const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newPath = `${parentPath}/${newName}`;

    folderItem.name = newName;
    folderItem.path = newPath;

    const processedItems = new Set<string>();

    // 2. 하위 항목 경로 업데이트 함수 수정
    const updateChildrenPath = (parentId: string, parentPath: string) => {
      foundBrowser.browser.forEach((item) => {
        if (item.parentId?.toString() === parentId) {
          if (processedItems.has(item._id.toString())) {
            return;
          }

          item.path = `${parentPath}/${item.name}`;
          processedItems.add(item._id.toString());

          if (item.itemType === 'Folder') {
            updateChildrenPath(item._id.toString(), item.path);
          }
        }
      });
    };

    updateChildrenPath(folderId, newPath);

    // 5. 변경사항 저장
    const result = await foundBrowser.save();
    return {
      isSuccess: true,
      result,
      oldPath,
      newPath,
    };
  }
}

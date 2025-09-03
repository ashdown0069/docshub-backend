import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { FilebrowserService } from './filebrowser.service';
import { Item } from 'src/common/database/schemas/file-browser-item.schema';
import { WorkspacesService } from 'src/workspaces/workspaces.service';
import { TransactionService } from 'src/common/database/transaction/transaction.service';
import * as fs from 'fs/promises';
import * as path from 'path';
@Injectable()
export class Filebrowser_Common_Service {
  constructor(
    private filebrowserService: FilebrowserService,
    private workspacesService: WorkspacesService,
    private transactionService: TransactionService,
  ) {}

  async moveItems(
    workspaceId: string,
    sourceIds: string[],
    targetId: string | null,
  ) {
    const foundBrowser = await this.filebrowserService.findOne(workspaceId);

    /**
     * 1. sourceIds에 targetId가 포함되어 있는지 확인
     * 2. targetId가 유효한지 확인
     * 3. targetId가 폴더인지 확인
     * 4. null 이면 브라우저의 루트
     */
    let targetItem = null;
    if (targetId) {
      if (sourceIds.includes(targetId)) {
        throw new BadRequestException('Cannot move item into itself');
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

    /**
     * 타겟 폴더가 소스 아이템의 자식인지 확인
     */
    const isDescendant = (targetItem: Item): boolean => {
      if (targetItem.parentId === null) return false;
      const parent = foundBrowser.browser.find(
        (item) =>
          item._id.toString() === targetItem.parentId?.toString() &&
          !item.isDeleted,
      );
      if (!parent) return false;
      if (sourceIds.includes(parent._id.toString())) return true;
      return isDescendant(parent);
    };

    if (targetItem && isDescendant(targetItem)) {
      throw new BadRequestException('Cannot move item into its descendant');
    }

    /**
     * 하위 항목 이동 함수, 폴더인 경우만 실행
     */
    const updateItems = new Set<string>();
    const moveChildren = (
      parentId: string | null,
      newParentPath: string,
      newDepth: number,
    ) => {
      const children = foundBrowser.browser.filter((item) => {
        if (item.isDeleted) return false;
        return item.parentId?.toString() === parentId;
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

    /**
     * 각 아이템에 대한 이동 처리
     * 1. sourceId가 존재하는지 확인
     * 2. 부모와 자식 관계 설정
     * 3. path 설정
     * 4. depth 설정
     * 5. 폴더인 경우 하위 항목 이동
     */
    for (const sourceId of sourceIds) {
      const sourceItem = foundBrowser.browser.find(
        (item) => item._id.toString() === sourceId && !item.isDeleted,
      );
      if (!sourceItem) {
        throw new BadRequestException(`Item ${sourceId} not found`);
      }

      // 대상 폴더에 같은 이름의 아이템이 있는지 확인
      const existingItem = foundBrowser.browser.find(
        (item) =>
          item.parentId?.toString() === targetId &&
          item.name === sourceItem.name &&
          !item.isDeleted &&
          item._id.toString() !== sourceId,
      );

      if (existingItem) {
        if (
          existingItem.itemType === 'Folder' &&
          sourceItem.itemType === 'Folder'
        ) {
          // 폴더인 경우 병합
          const sourceChildren = foundBrowser.browser.filter(
            (item) => item.parentId?.toString() === sourceId && !item.isDeleted,
          );

          // 소스 폴더의 자식들을 기존 폴더로 이동
          for (const child of sourceChildren) {
            child.parentId = existingItem._id;
            child.path = `${existingItem.path}/${child.name}`;
            child.depth = existingItem.depth + 1;

            if (child.itemType === 'Folder') {
              moveChildren(child._id.toString(), child.path, child.depth + 1);
            }
          }

          // 소스 폴더를 삭제 처리, 나중에 수정예정
          sourceItem.isDeleted = new Date();
        } else if (
          existingItem.itemType === 'File' &&
          sourceItem.itemType === 'File'
        ) {
          // 파일인 경우 덮어쓸지 여부 확인 후 처리, 미완성
          // existingItem.isDeleted = new Date();
          // sourceItem.parentId = targetId ? new Types.ObjectId(targetId) : null;
          // sourceItem.path = targetItem
          //   ? `${targetItem.path}/${sourceItem.name}`
          //   : `/${sourceItem.name}`;
          // sourceItem.depth = targetItem ? targetItem.depth + 1 : 0;
          // sourceItem.src = existingItem.src;
        }
      } else {
        // 같은 이름의 아이템이 없는 경우 일반적인 이동
        sourceItem.parentId = targetId ? new Types.ObjectId(targetId) : null;
        sourceItem.path = targetItem
          ? `${targetItem.path}/${sourceItem.name}`
          : `/${sourceItem.name}`;
        sourceItem.depth = targetItem ? targetItem.depth + 1 : 0;

        if (sourceItem.itemType === 'Folder') {
          moveChildren(sourceId, sourceItem.path, sourceItem.depth + 1);
        }
      }
    }

    const result = await foundBrowser.save();
    return {
      isSuccess: true,
    };
  }

  async deleteItems(workspaceId: string, sourceIds: string[]) {
    return this.transactionService.executeInTransaction(async (session) => {
      const foundBrowser = await this.filebrowserService.findOne(workspaceId);
      const currentDate = new Date();
      let totalSize = 0;
      /**
       *  하위 항목 삭제 함수
       *  폴더인 경우에 실행하여 폴더 및 파일 삭제처리
       */
      const deleteChildren = (parentId: string) => {
        foundBrowser.browser.forEach((child) => {
          if (child.parentId?.toString() === parentId && !child.isDeleted) {
            child.isDeleted = currentDate;
            totalSize += child.fileSize;
            if (child.itemType === 'Folder') {
              deleteChildren(child._id.toString());
            }
          }
        });
      };

      for (const sourceId of sourceIds) {
        const item = foundBrowser.browser.find(
          (item) => item._id.toString() === sourceId && !item.isDeleted,
        );

        if (!item) {
          throw new NotFoundException('Item not found or already deleted');
        }
        item.isDeleted = currentDate;
        totalSize += item.fileSize;

        if (item.itemType === 'Folder') {
          deleteChildren(sourceId);
        }
      }

      await foundBrowser.save({ session });

      // 용량 업데이트
      await this.workspacesService.updateCurrentStorage(
        workspaceId,
        totalSize,
        'decrease',
        session,
      );
      return { isSuccess: true };
    });
  }

  async renameItem(workspaceId: string, itemId: string, newName: string) {
    const foundBrowser = await this.filebrowserService.findOne(workspaceId);

    // 1. 아이템 찾기 및 유효성 검사
    const item = foundBrowser.browser.find(
      (item) => item._id.toString() === itemId && !item.isDeleted,
    );

    if (!item) {
      throw new NotFoundException('Item not found or already deleted');
    }

    // 2. 중복 이름 검사
    const hasDuplicateName = foundBrowser.browser.some(
      (browserItem) =>
        browserItem.itemType === item.itemType &&
        browserItem._id.toString() !== itemId &&
        browserItem.parentId?.toString() === item.parentId?.toString() &&
        browserItem.name.toLowerCase() === newName.toLowerCase() &&
        !browserItem.isDeleted,
    );

    if (hasDuplicateName) {
      throw new BadRequestException({
        message:
          item.itemType === 'Folder'
            ? 'Folder name already exists'
            : 'File name already exists',
        key: 'duplicate',
      });
    }

    // 3. 경로 업데이트

    let NEW__FILENAME = '';
    if (item.itemType == 'File') {
      NEW__FILENAME = newName.concat('.', item.fileExtension);
    } else if (item.itemType == 'Folder') {
      NEW__FILENAME = newName;
    }
    const oldPath = item.path;
    const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newPath = `${parentPath}/${NEW__FILENAME}`;

    //4-1 파일인 경우 실제 파일 이름 변경
    if (item.itemType == 'File') {
      const uploadDir = path.join(process.cwd(), 'uploads', workspaceId);
      const oldFilePath = path.join(uploadDir, item.name);
      const newFilePath = path.join(uploadDir, NEW__FILENAME);
      try {
        await fs.rename(oldFilePath, newFilePath);
      } catch (err) {
        throw new BadRequestException(
          `Failed to rename
      ${item.itemType.toLowerCase()}: ${err.message}
      `,
        );
      }
      //파일 경로 변경
      item.src = newFilePath;
    }
    //4-2 공통부분 변경
    item.path = newPath;
    item.name = NEW__FILENAME;

    // 5. 폴더인 경우 하위 항목 경로도 업데이트
    if (item.itemType === 'Folder') {
      const processedItems = new Set<string>();
      const updateChildrenPath = (parentId: string, parentPath: string) => {
        foundBrowser.browser.forEach((child) => {
          if (child.parentId?.toString() === parentId) {
            if (processedItems.has(child._id.toString())) {
              return;
            }

            child.path = `${parentPath}/${child.name}`;
            processedItems.add(child._id.toString());

            if (child.itemType === 'Folder') {
              updateChildrenPath(child._id.toString(), child.path);
            }
          }
        });
      };

      updateChildrenPath(itemId, newPath);
    }

    // 6. 변경사항 저장
    const result = await foundBrowser.save();
    return {
      isSuccess: true,
      result,
      oldPath,
      newPath,
    };
  }
}

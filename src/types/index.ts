declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
export type Role = 'owner' | 'manager' | 'member';
export type WorkspacePermissionTable = {
  canManage: boolean;
  canRemoveMembers: boolean;
  canDownload: boolean;
  canUpload: boolean;
  canRename: boolean;
  canShare: boolean;
  canDelete: boolean;
  canLock: boolean;
  canMove: boolean;
};

export type WorkspacePermission =
  | 'canManage'
  | 'canRemoveMembers'
  | 'canDownload'
  | 'canUpload'
  | 'canRename'
  | 'canShare'
  | 'canDelete'
  | 'canLock'
  | 'canMove';

export interface ServiceDeleteResponse {
  isSuccess: boolean;
}

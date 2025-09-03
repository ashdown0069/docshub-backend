import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePermissionDto {
  @Expose()
  _id: string;

  @Expose()
  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, value }) => (obj.role === 'manager' ? value : undefined))
  canRemoveMembers: boolean;

  @Expose()
  @IsBoolean()
  canDownload: boolean;

  @Expose()
  @IsBoolean()
  canUpload: boolean;

  @Expose()
  @IsBoolean()
  canRename: boolean;

  @Expose()
  @IsBoolean()
  canDelete: boolean;

  @Expose()
  @IsBoolean()
  canMove: boolean;

  @Expose()
  @IsBoolean()
  canLock: boolean;

  @Expose()
  role: 'member' | 'manager';
}

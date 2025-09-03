import { Expose, Transform } from 'class-transformer';

export class FindWorkspacesDto {
  @Expose()
  _id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  membersCount: number;

  @Expose()
  capacity: number;

  @Expose()
  isBookmarked: boolean;

  @Expose()
  updatedAt: Date;

  @Expose()
  createdAt: Date;
}

export class FindWorkspaceDto {
  @Expose()
  _id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  membersCount: number;

  @Expose()
  capacity: number;

  @Expose()
  currentStorage: number;

  @Expose()
  maxStorage: number;

  @Expose()
  updatedAt: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  @Transform(({ obj }) => !!obj.password)
  isLocked: boolean;
}

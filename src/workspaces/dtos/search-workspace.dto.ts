import { Expose, Transform } from 'class-transformer';

export class SearchWorkspaceDto {
  @Expose()
  _id: string;

  @Expose()
  name: string;

  @Expose()
  membersCount: number;

  @Expose()
  capacity: number;

  @Expose()
  @Transform(({ obj }) => !!obj.password)
  isLocked: boolean;
}

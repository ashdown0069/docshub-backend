import { Expose } from 'class-transformer';

export class FindAllUserJoinedWsDto {
  @Expose()
  _id: string;

  @Expose()
  name: string;

  @Expose()
  description: string | null;

  @Expose()
  isLocked: boolean;

  @Expose()
  capacity: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

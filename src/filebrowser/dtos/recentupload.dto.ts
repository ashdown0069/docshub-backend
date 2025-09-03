import { Expose } from 'class-transformer';

export class RecentUploadDto {
  @Expose()
  _id: string;
  @Expose()
  name: string;
  @Expose()
  createdAt: Date;
}

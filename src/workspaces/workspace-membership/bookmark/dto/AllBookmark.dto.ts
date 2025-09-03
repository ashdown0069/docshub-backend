import { Expose } from 'class-transformer';
import { IsMongoId } from 'class-validator';

export class FindBookmarkDto {
  @Expose()
  _id: string;

  @Expose()
  name: string;
}

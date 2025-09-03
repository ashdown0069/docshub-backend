import { IsArray, IsNotEmpty } from 'class-validator';

export class DeleteItemsDto {
  @IsArray()
  @IsNotEmpty()
  folderIds: string[];
}

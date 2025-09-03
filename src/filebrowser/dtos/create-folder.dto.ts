import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  folderName: string;

  @IsOptional()
  @IsString()
  parentId: string;
}

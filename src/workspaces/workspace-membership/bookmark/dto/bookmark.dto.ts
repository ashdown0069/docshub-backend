import { IsString } from 'class-validator';

export class AddBookmarkDto {
  @IsString()
  workspaceId: string;
}

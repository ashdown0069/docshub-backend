import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAnnouncementsDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  workspaceId: string;
}

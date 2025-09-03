import { IsBoolean, IsString } from 'class-validator';

export class UpdateWorkspaceDto {
  @IsString()
  workspaceId: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  password: string;

  @IsBoolean()
  downloadRecord: boolean;
}

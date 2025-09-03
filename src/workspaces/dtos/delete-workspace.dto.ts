import { IsEmail, IsOptional, IsString } from 'class-validator';

export class DeleteWorkspaceDto {
  @IsString()
  workspaceId: string;

  @IsOptional()
  @IsString()
  password: string;
}

export class DeleteWorkspaceMemberDto {
  @IsString()
  workspaceId: string;

  @IsEmail()
  targetUserEmail: string;
}

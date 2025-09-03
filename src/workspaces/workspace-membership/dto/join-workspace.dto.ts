import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class JoinWorkspaceMembershipDto {
  @IsNotEmpty()
  @IsString()
  workspaceId: string;

  @IsString()
  @IsOptional()
  workspacePassword: string;
}

import { PartialType } from '@nestjs/swagger';
import { CreateWorkspaceMembershipDto } from './create-workspace-membership.dto';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateWorkspaceMembershipDto {
  @IsString()
  workspaceId: string;

  @IsOptional()
  @IsString()
  targetUserId: string;

  @IsOptional()
  @IsEnum(['owner', 'member', 'manager'])
  role: 'owner' | 'member' | 'manager';

  @IsOptional()
  @IsBoolean()
  isBookmarked: boolean;
}

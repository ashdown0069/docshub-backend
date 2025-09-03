import { IsEnum, IsString } from 'class-validator';

export class CreateWorkspaceMembershipDto {
  @IsString()
  workspaceId: string;

  @IsEnum(['owner', 'member', 'manager'])
  role: 'owner' | 'member' | 'manager';
}

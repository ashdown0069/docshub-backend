import { IsEnum, IsNotEmpty, isString } from 'class-validator';

export enum WorkspaceRole {
  MEMBER = 'member',
  MANAGER = 'manager',
  OWNER = 'owner',
}
export class UpdateRoleDto {
  @IsNotEmpty()
  @IsEnum(WorkspaceRole, { message: 'Must be a valid role' })
  role: WorkspaceRole;
}

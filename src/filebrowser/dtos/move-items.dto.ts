import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MoveItemsDto {
  @IsArray()
  @IsNotEmpty()
  sourceIds: string[];

  @IsString()
  @IsOptional()
  targetId: string | null;
}

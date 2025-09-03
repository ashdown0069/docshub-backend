import { IsNotEmpty, IsString } from 'class-validator';

//rename
export class UpdateItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

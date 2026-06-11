import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCatalogItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

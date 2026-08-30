import { IsString } from 'class-validator';

export class UpdateProductShopDto {
  @IsString()
  shopId: string;
}

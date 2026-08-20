import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductStockItemDto {
  @IsString()
  @IsNotEmpty()
  size: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;
}

export class UpdateProductStockDto {
  @IsBoolean()
  inStock: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductStockItemDto)
  sizes: ProductStockItemDto[];
}

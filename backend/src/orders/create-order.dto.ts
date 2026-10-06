import { Type } from 'class-transformer';

import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  size: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsEmail(
    {},
    {
      message: 'Введите корректный email',
    },
  )
  @MaxLength(254)
  email: string;

  @IsString()
  @Matches(/^\+7\d{10}$/, {
    message: 'phone must be in +7XXXXXXXXXX format',
  })
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  deliveryMethod?: string;

  @ValidateIf(
    (order: CreateOrderDto) =>
      order.deliveryMethod === 'Доставка',
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({
    each: true,
  })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
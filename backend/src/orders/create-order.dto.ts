import { Type } from 'class-transformer';

import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  size: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail(
    {},
    {
      message: 'Введите корректный email',
    },
  )
  email: string;

  @IsString()
  @Matches(/^\+7\d{10}$/, {
    message: 'phone must be in +7XXXXXXXXXX format',
  })
  phone: string;

  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @ValidateIf(
    (order: CreateOrderDto) =>
      order.deliveryMethod === 'Доставка',
  )
  @IsString()
  @IsNotEmpty()
  address?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({
    each: true,
  })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
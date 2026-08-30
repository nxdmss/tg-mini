import { Controller, Get, Param } from '@nestjs/common';
import { ShopsService } from './shops.service';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  findAll() {
    return this.shopsService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.shopsService.findOne(slug);
  }
}

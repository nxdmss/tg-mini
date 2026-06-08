import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('brands')
  brands() {
    return this.catalogService.brands();
  }

  @Get('categories')
  categories() {
    return this.catalogService.categories();
  }
}

import { IsBoolean } from 'class-validator';

export class ArchiveOrderDto {
  @IsBoolean()
  archived: boolean;
}

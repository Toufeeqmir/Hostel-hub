
import { PartialType } from '@nestjs/mapped-types';
import { CreateOccupancyDto } from './create-occupancy.dto.js';

export class UpdateOccupancyDto extends PartialType(
  CreateOccupancyDto,
) {}

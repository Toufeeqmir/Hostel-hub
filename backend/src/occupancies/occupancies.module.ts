
import { Module } from '@nestjs/common';

import { OccupanciesController } from './occupancies.controller.js';
import { OccupanciesService } from './occupancies.service.js';

@Module({
  controllers: [OccupanciesController],
  providers: [OccupanciesService],
})
export class OccupanciesModule {}

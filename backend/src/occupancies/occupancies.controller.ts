
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';

import { OccupanciesService } from './occupancies.service.js';
import { CreateOccupancyDto } from './dto/create-occupancy.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';

@Controller('organizations/:organizationId/occupancies')
@UseGuards(JwtAuthGuard, OrganizationMemberGuard)
export class OccupanciesController {
  constructor(
    private readonly occupanciesService: OccupanciesService,
  ) {}

  // CHECK IN TENANT
  @Post()
  checkIn(
    @Body() dto: CreateOccupancyDto,
    @Req() req: any,
  ) {
    return this.occupanciesService.checkIn(
      req.organization.id,
      dto,
    );
  }

  // GET ALL OCCUPANCIES WITH PAGINATION AND FILTERING
  @Get()
  findAll(
    @Req() req: any,
    @Query() query: PaginationQueryDto,
  ) {
    return this.occupanciesService.findAll(
      req.organization.id,
      query,
    );
  }

  // GET TENANT OCCUPANCY HISTORY
  @Get('tenant/:tenantId/history')
  getTenantHistory(
    @Param('tenantId') tenantId: string,
    @Req() req: any,
  ) {
    return this.occupanciesService.getTenantHistory(
      req.organization.id,
      tenantId,
    );
  }

  // GET SINGLE OCCUPANCY
  @Get(':occupancyId')
  findOne(
    @Param('occupancyId') occupancyId: string,
    @Req() req: any,
  ) {
    return this.occupanciesService.findOne(
      req.organization.id,
      occupancyId,
    );
  }

  // CHECK OUT TENANT
  @Patch(':occupancyId/check-out')
  checkOut(
    @Param('occupancyId') occupancyId: string,
    @Req() req: any,
  ) {
    return this.occupanciesService.checkOut(
      req.organization.id,
      occupancyId,
    );
  }
}

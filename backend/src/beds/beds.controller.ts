
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { BedsService } from './beds.service.js';
import { CreateBedDto } from './dto/create-bed.dto.js';
import { UpdateBedDto } from './dto/update-bed.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
  organization: {
    id: string;
    role: string;
  };
}

@Controller(
  'organizations/:organizationId/properties/:propertyId/rooms/:roomId/beds',
)
@UseGuards(JwtAuthGuard, OrganizationMemberGuard)
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  // CREATE BED
  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Body() dto: CreateBedDto,
  ) {
    return this.bedsService.create(
      req.organization.id,
      propertyId,
      roomId,
      dto,
    );
  }

  // GET ALL BEDS WITH PAGINATION AND FILTERING
  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.bedsService.findAll(
      req.organization.id,
      propertyId,
      roomId,
      query,
    );
  }

  // GET SINGLE BED
  @Get(':bedId')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Param('bedId') bedId: string,
  ) {
    return this.bedsService.findOne(
      req.organization.id,
      propertyId,
      roomId,
      bedId,
    );
  }

  // UPDATE BED
  @Patch(':bedId')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Param('bedId') bedId: string,
    @Body() dto: UpdateBedDto,
  ) {
    return this.bedsService.update(
      req.organization.id,
      propertyId,
      roomId,
      bedId,
      dto,
    );
  }

  // DEACTIVATE BED
  @Delete(':bedId')
  deactivate(
    @Req() req: AuthenticatedRequest,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Param('bedId') bedId: string,
  ) {
    return this.bedsService.deactivate(
      req.organization.id,
      propertyId,
      roomId,
      bedId,
    );
  }
}

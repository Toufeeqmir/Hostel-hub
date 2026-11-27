
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';

import { PropertiesService } from './properties.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';

@Controller('organizations/:organizationId/properties')
@UseGuards(JwtAuthGuard, OrganizationMemberGuard)
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
  ) {}

  // Create a new property
  @Post()
  create(
    @Req() req: any,
    @Body() createPropertyDto: CreatePropertyDto,
  ) {
    return this.propertiesService.create(
      req.organization.id,
      createPropertyDto,
    );
  }

  // Get all properties with pagination and filtering
  @Get()
  findAll(
    @Req() req: any,
    @Query() query: PaginationQueryDto,
  ) {
    return this.propertiesService.findAll(
      req.organization.id,
      query,
    );
  }

  // Get a single property
  @Get(':propertyId')
  findOne(
    @Req() req: any,
    @Param('propertyId') propertyId: string,
  ) {
    return this.propertiesService.findOne(
      req.organization.id,
      propertyId,
    );
  }

  // Update property details
  @Patch(':propertyId')
  update(
    @Req() req: any,
    @Param('propertyId') propertyId: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(
      req.organization.id,
      propertyId,
      updatePropertyDto,
    );
  }

  // Deactivate a property
  @Delete(':propertyId')
  deactivate(
    @Req() req: any,
    @Param('propertyId') propertyId: string,
  ) {
    return this.propertiesService.deactivate(
      req.organization.id,
      propertyId,
    );
  }
}

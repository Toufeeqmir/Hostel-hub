
import {
  Controller,
  Post,
  Get,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';

import { PropertiesService } from './properties.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';

import { UpdatePropertyDto } from './dto/update-property.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';

@Controller('organizations/:organizationId/properties')
@UseGuards(JwtAuthGuard, OrganizationMemberGuard)
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
  ) {}

  @Post()
  async create(
    @Req() request: any,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.create(
      request.organization.id,
      dto,
    );
  }

  @Get()
  async findAll(@Req() request: any) {
    return this.propertiesService.findAll(
      request.organization.id,
    );
  }

  @Get(':propertyId')
  async findOne(
    @Req() request: any,
    @Param('propertyId') propertyId: string,
  ) {
    return this.propertiesService.findOne(
      request.organization.id,
      propertyId,
    );
  }

  @Patch(':propertyId')
async update(
  @Req() request: any,
  @Param('propertyId') propertyId: string,
  @Body() dto: UpdatePropertyDto,
) {
  return this.propertiesService.update(
    request.organization.id,
    propertyId,
    dto,
  );
}

@Delete(':propertyId')
async deactivate(
   @Req() request: any,
   @Param('propertyId') propertyId: string,
){
   return this.propertiesService.deactivate(
     request.organization.id,
     propertyId,
   );
}
}

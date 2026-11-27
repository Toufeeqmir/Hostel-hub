
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';

import { TenantsService } from './tenants.service.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';

@Controller('organizations/:organizationId/tenants')
@UseGuards(JwtAuthGuard, OrganizationMemberGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // CREATE TENANT
  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateTenantDto,
  ) {
    return this.tenantsService.create(
      req.organization.id,
      dto,
    );
  }

  // GET ALL TENANTS WITH PAGINATION AND FILTERING
  @Get()
  findAll(
    @Req() req: any,
    @Query() query: PaginationQueryDto,
  ) {
    return this.tenantsService.findAll(
      req.organization.id,
      query,
    );
  }

  // GET SINGLE TENANT
  @Get(':tenantId')
  findOne(
    @Req() req: any,
    @Param('tenantId') tenantId: string,
  ) {
    return this.tenantsService.findOne(
      req.organization.id,
      tenantId,
    );
  }

  // UPDATE TENANT
  @Patch(':tenantId')
  update(
    @Req() req: any,
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(
      req.organization.id,
      tenantId,
      dto,
    );
  }

  // DEACTIVATE TENANT
  @Delete(':tenantId')
  deactivate(
    @Req() req: any,
    @Param('tenantId') tenantId: string,
  ) {
    return this.tenantsService.deactivate(
      req.organization.id,
      tenantId,
    );
  }
}

import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('organizations')
export class OrganizationsController {
  @Get(':organizationId/owner-check')
  @UseGuards(
    JwtAuthGuard,
    OrganizationMemberGuard,
    RolesGuard,
  )
  @Roles('OWNER')
  checkOwnerAccess(
    @Param('organizationId') organizationId: string,
    @Req() request: any,
  ) {
    return {
      message: 'Organization authorization successful',
      userId: request.user.userId,
      organizationId: request.organization.id,
      role: request.organization.role,
    };
  }
}





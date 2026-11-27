import { Module } from '@nestjs/common';

import { OrganizationsController } from './organization.controller.js';

import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Module({
  controllers: [OrganizationsController],
  providers: [
    OrganizationMemberGuard,
    RolesGuard,
  ],
})
export class OrganizationsModule {}
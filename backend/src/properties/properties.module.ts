import { Module } from  '@nestjs/common';
import { PropertiesController } from './properties.controller.js';
import { PropertiesService } from './properties.service.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';

@Module({
     controllers: [PropertiesController],
     providers: [PropertiesService, OrganizationMemberGuard],
})

export class PropertiesModule {}
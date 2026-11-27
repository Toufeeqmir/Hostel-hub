import {
     Controller,
     Get,
     Req,
     UseGuards,
} from '@nestjs/common';

import { DashboardService  } from './dashboard.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';

@Controller('organizations/:organizationId/dashboard')
@UseGuards(JwtAuthGuard, OrganizationMemberGuard)
export class DashboardController{
     constructor(
         private readonly dashboardService: DashboardService,
     ){}

     @Get()
     getStatistics(@Req() req:any){
        return this.dashboardService.getStatistics(
            req.organizationId,
        );
     }
}
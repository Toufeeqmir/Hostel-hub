import { Module } from '@nestjs/common';

import { RoomsController } from './rooms.controller.js';
import  { RoomsService } from './rooms.service.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';

@Module({
     controllers:[RoomsController],
     providers: [RoomsService, OrganizationMemberGuard],
})

export class RoomsModule {}
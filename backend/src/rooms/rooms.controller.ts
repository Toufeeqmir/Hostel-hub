
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

import { RoomsService } from './rooms.service.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';
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
  'organizations/:organizationId/properties/:propertyId/rooms',
)
@UseGuards(JwtAuthGuard, OrganizationMemberGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // CREATE ROOM
  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateRoomDto,
  ) {
    return this.roomsService.create(
      req.organization.id,
      propertyId,
      dto,
    );
  }

  // GET ALL ROOMS WITH PAGINATION AND FILTERING
  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Param('propertyId') propertyId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.roomsService.findAll(
      req.organization.id,
      propertyId,
      query,
    );
  }

  // UPDATE ROOM
  @Patch(':roomId')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.update(
      req.organization.id,
      propertyId,
      roomId,
      dto,
    );
  }

  // DEACTIVATE ROOM
  @Delete(':roomId')
  deactivate(
    @Req() req: AuthenticatedRequest,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
  ) {
    return this.roomsService.deactivate(
      req.organization.id,
      propertyId,
      roomId,
    );
  }
}

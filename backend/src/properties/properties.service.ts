
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreatePropertyDto) {
    if (
      (dto.latitude !== undefined && dto.longitude === undefined) ||
      (dto.latitude === undefined && dto.longitude !== undefined)
    ) {
      throw new BadRequestException(
        'Both latitude and longitude must be provided together',
      );
    }

    const property = await this.prisma.property.create({
      data: {
        organizationId,
        name: dto.name,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        propertyType: dto.propertyType,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    return {
      message: 'Property created successfully',
      property,
    };
  }

  async findAll(organizationId: string) {
    return this.prisma.property.findMany({
      where: { organizationId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        organizationId,
        isActive: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async update(
    organizationId: string,
    propertyId: string,
    dto: UpdatePropertyDto,
  ) {
    const property = await this.findOne(organizationId, propertyId);

    const hasLatitude = dto.latitude !== undefined;
    const hasLongitude = dto.longitude !== undefined;

    if (hasLatitude !== hasLongitude) {
      throw new BadRequestException(
        'Both latitude and longitude must be provided together',
      );
    }

    const updatedProperty = await this.prisma.property.update({
      where: { id: property.id },
      data: dto,
    });

    return {
      message: 'Property updated successfully',
      property: updatedProperty,
    };
  }

  async deactivate(organizationId: string, propertyId: string) {
    const property = await this.findOne(organizationId, propertyId);

    const activeOccupancies = await this.prisma.occupancy.count({
      where: {
        status: 'ACTIVE',
        bed: {
          room: {
            propertyId: property.id,
          },
        },
      },
    });

    if (activeOccupancies > 0) {
      throw new BadRequestException(
        'Cannot deactivate property while tenants are occupying beds',
      );
    }

    const updatedProperty = await this.prisma.property.update({
      where: { id: property.id },
      data: { isActive: false },
    });

    return {
      message: 'Property deactivated successfully',
      property: updatedProperty,
    };
  }
}

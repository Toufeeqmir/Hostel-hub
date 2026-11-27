
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

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

  async findAll(
    organizationId: string,
    query: PaginationQueryDto,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Validate property status filter
    if (
      query.status &&
      !['active', 'inactive'].includes(query.status.toLowerCase())
    ) {
      throw new BadRequestException(
        'Status must be either active or inactive',
      );
    }

    const isActive =
      query.status?.toLowerCase() === 'inactive' ? false : true;

    const where = {
      organizationId,
      isActive,
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                city: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                state: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [totalRecords, properties] = await Promise.all([
      this.prisma.property.count({ where }),

      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: query.sortOrder || 'desc',
        },
      }),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      properties,
      pagination: {
        totalRecords,
        currentPage: page,
        pageSize: limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
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


import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBedDto } from './dto/create-bed.dto.js';
import { UpdateBedDto } from './dto/update-bed.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

@Injectable()
export class BedsService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE BED
  async create(
    organizationId: string,
    propertyId: string,
    roomId: string,
    dto: CreateBedDto,
  ) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        organizationId,
        isActive: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Active property not found');
    }

    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        propertyId: property.id,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.status === 'INACTIVE') {
      throw new BadRequestException(
        'Cannot add beds to an inactive room',
      );
    }

    const totalBeds = await this.prisma.bed.count({
      where: {
        roomId: room.id,
      },
    });

    if (totalBeds >= room.capacity) {
      throw new BadRequestException(
        'Room has reached its maximum bed capacity',
      );
    }

    const existingBed = await this.prisma.bed.findUnique({
      where: {
        roomId_bedNumber: {
          roomId,
          bedNumber: dto.bedNumber,
        },
      },
    });

    if (existingBed) {
      throw new ConflictException(
        'Bed number already exists in this room',
      );
    }

    const bed = await this.prisma.bed.create({
      data: {
        roomId,
        bedNumber: dto.bedNumber,
      },
    });

    return {
      message: 'Bed created successfully',
      bed,
    };
  }

  // GET ALL BEDS WITH PAGINATION AND FILTERING
  async findAll(
    organizationId: string,
    propertyId: string,
    roomId: string,
    query: PaginationQueryDto,
  ) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        organizationId,
        isActive: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Active property not found');
    }

    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        propertyId: property.id,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const validStatuses = [
      'AVAILABLE',
      'OCCUPIED',
      'RESERVED',
      'MAINTENANCE',
      'INACTIVE',
    ];

    const status = query.status?.toUpperCase();

    if (status && !validStatuses.includes(status)) {
      throw new BadRequestException(
        'Invalid bed status. Use AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE or INACTIVE',
      );
    }

    const where = {
      roomId: room.id,
      ...(status
        ? {
            status: status as
              | 'AVAILABLE'
              | 'OCCUPIED'
              | 'RESERVED'
              | 'MAINTENANCE'
              | 'INACTIVE',
          }
        : {}),
      ...(query.search
        ? {
            bedNumber: {
              contains: query.search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [totalRecords, beds] = await Promise.all([
      this.prisma.bed.count({ where }),

      this.prisma.bed.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          bedNumber: query.sortOrder || 'asc',
        },
      }),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      propertyId: property.id,
      roomId: room.id,
      total: totalRecords,
      beds,
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

  // GET SINGLE BED
  async findOne(
    organizationId: string,
    propertyId: string,
    roomId: string,
    bedId: string,
  ) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        organizationId,
        isActive: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Active property not found');
    }

    const bed = await this.prisma.bed.findFirst({
      where: {
        id: bedId,
        roomId,
        room: {
          propertyId: property.id,
        },
      },
      include: {
        room: true,
      },
    });

    if (!bed) {
      throw new NotFoundException('Bed not found');
    }

    return bed;
  }

  // UPDATE BED
  async update(
    organizationId: string,
    propertyId: string,
    roomId: string,
    bedId: string,
    dto: UpdateBedDto,
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'At least one field is required',
      );
    }

    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        organizationId,
        isActive: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Active property not found');
    }

    const bed = await this.prisma.bed.findFirst({
      where: {
        id: bedId,
        roomId,
        room: {
          propertyId: property.id,
        },
      },
    });

    if (!bed) {
      throw new NotFoundException('Bed not found');
    }

    if (dto.bedNumber && dto.bedNumber !== bed.bedNumber) {
      const existingBed = await this.prisma.bed.findUnique({
        where: {
          roomId_bedNumber: {
            roomId,
            bedNumber: dto.bedNumber,
          },
        },
      });

      if (existingBed) {
        throw new ConflictException(
          'Bed number already exists in this room',
        );
      }
    }

    const updatedBed = await this.prisma.bed.update({
      where: {
        id: bedId,
      },
      data: dto,
    });

    return {
      message: 'Bed updated successfully',
      bed: updatedBed,
    };
  }

  // DEACTIVATE BED (SOFT DELETE)
  async deactivate(
    organizationId: string,
    propertyId: string,
    roomId: string,
    bedId: string,
  ) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        organizationId,
        isActive: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Active property not found');
    }

    const bed = await this.prisma.bed.findFirst({
      where: {
        id: bedId,
        roomId,
        room: {
          propertyId: property.id,
        },
      },
    });

    if (!bed) {
      throw new NotFoundException('Bed not found');
    }

    if (bed.status === 'INACTIVE') {
      throw new ConflictException('Bed is already inactive');
    }

    const activeOccupancy = await this.prisma.occupancy.findFirst({
      where: {
        bedId: bed.id,
        status: 'ACTIVE',
      },
    });

    if (activeOccupancy) {
      throw new ConflictException(
        'Cannot deactivate a bed with an active tenant occupancy',
      );
    }

    if (bed.status === 'RESERVED') {
      throw new ConflictException(
        'Cannot deactivate a reserved bed',
      );
    }

    const updatedBed = await this.prisma.bed.update({
      where: {
        id: bed.id,
      },
      data: {
        status: 'INACTIVE',
      },
    });

    return {
      message: 'Bed deactivated successfully',
      bed: updatedBed,
    };
  }
}

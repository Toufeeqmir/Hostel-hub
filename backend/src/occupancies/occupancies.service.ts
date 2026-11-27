
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOccupancyDto } from './dto/create-occupancy.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

@Injectable()
export class OccupanciesService {
  constructor(private readonly prisma: PrismaService) {}

  // CHECK IN TENANT
  async checkIn(
    organizationId: string,
    dto: CreateOccupancyDto,
  ) {
    // 1. Verify tenant belongs to organization and is active
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: dto.tenantId,
        organizationId,
        isActive: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Active tenant not found');
    }

    // 2. Prevent tenant from having multiple active occupancies
    const existingOccupancy =
      await this.prisma.occupancy.findFirst({
        where: {
          tenantId: tenant.id,
          status: 'ACTIVE',
        },
      });

    if (existingOccupancy) {
      throw new ConflictException(
        'Tenant already has an active occupancy',
      );
    }

    // 3. Verify bed belongs to the organization
    const bed = await this.prisma.bed.findFirst({
      where: {
        id: dto.bedId,
        room: {
          property: {
            organizationId,
            isActive: true,
          },
        },
      },
      include: {
        room: true,
      },
    });

    if (!bed) {
      throw new NotFoundException('Bed not found');
    }

    // 4. Verify room is not inactive or under maintenance
    if (
      bed.room.status === 'INACTIVE' ||
      bed.room.status === 'MAINTENANCE'
    ) {
      throw new BadRequestException(
        'Cannot assign a bed in an inactive or maintenance room',
      );
    }

    // 5. Verify bed is available
    if (bed.status !== 'AVAILABLE') {
      throw new ConflictException(
        'Bed is not available for allocation',
      );
    }

    // 6. Create occupancy and update bed atomically
    const occupancy = await this.prisma.$transaction(
      async (tx) => {
        const bedUpdate = await tx.bed.updateMany({
          where: {
            id: bed.id,
            status: 'AVAILABLE',
          },
          data: {
            status: 'OCCUPIED',
          },
        });

        if (bedUpdate.count !== 1) {
          throw new ConflictException(
            'Bed is no longer available for allocation',
          );
        }

        return tx.occupancy.create({
          data: {
            tenantId: tenant.id,
            bedId: bed.id,
            monthlyRent: dto.monthlyRent,
            securityDeposit: dto.securityDeposit ?? 0,
            checkInDate: dto.checkInDate
              ? new Date(dto.checkInDate)
              : new Date(),
            status: 'ACTIVE',
          },
          include: {
            tenant: true,
            bed: {
              include: {
                room: true,
              },
            },
          },
        });
      },
    );

    return {
      message: 'Tenant checked in successfully',
      occupancy,
    };
  }

  // GET ALL OCCUPANCIES WITH PAGINATION AND FILTERING
  async findAll(
    organizationId: string,
    query: PaginationQueryDto,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Validate occupancy status
    const validStatuses = [
      'ACTIVE',
      'COMPLETED',
      'CANCELLED',
    ];

    const status = query.status?.toUpperCase();

    if (status && !validStatuses.includes(status)) {
      throw new BadRequestException(
        'Invalid occupancy status. Use ACTIVE, COMPLETED or CANCELLED',
      );
    }

    // Build database filter
    const where = {
      bed: {
        room: {
          property: {
            organizationId,
          },
        },
      },

      ...(status
        ? {
            status: status as
              | 'ACTIVE'
              | 'COMPLETED'
              | 'CANCELLED',
          }
        : {}),

      ...(query.search
        ? {
            tenant: {
              is: {
                OR: [
                  {
                    name: {
                      contains: query.search,
                      mode: 'insensitive' as const,
                    },
                  },
                  {
                    email: {
                      contains: query.search,
                      mode: 'insensitive' as const,
                    },
                  },
                  {
                    phone: {
                      contains: query.search,
                    },
                  },
                ],
              },
            },
          }
        : {}),
    };

    // Fetch total count and current page records
    const [totalRecords, occupancies] = await Promise.all([
      this.prisma.occupancy.count({
        where,
      }),

      this.prisma.occupancy.findMany({
        where,
        skip,
        take: limit,
        include: {
          tenant: true,
          bed: {
            include: {
              room: {
                include: {
                  property: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: query.sortOrder || 'desc',
        },
      }),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      total: totalRecords,
      occupancies,
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

  // GET SINGLE OCCUPANCY
  async findOne(
    organizationId: string,
    occupancyId: string,
  ) {
    const occupancy =
      await this.prisma.occupancy.findFirst({
        where: {
          id: occupancyId,
          bed: {
            room: {
              property: {
                organizationId,
              },
            },
          },
        },
        include: {
          tenant: true,
          bed: {
            include: {
              room: {
                include: {
                  property: true,
                },
              },
            },
          },
        },
      });

    if (!occupancy) {
      throw new NotFoundException('Occupancy not found');
    }

    return occupancy;
  }

  // CHECK OUT TENANT
  async checkOut(
    organizationId: string,
    occupancyId: string,
  ) {
    // 1. Verify occupancy belongs to organization
    const occupancy =
      await this.prisma.occupancy.findFirst({
        where: {
          id: occupancyId,
          bed: {
            room: {
              property: {
                organizationId,
              },
            },
          },
        },
      });

    if (!occupancy) {
      throw new NotFoundException('Occupancy not found');
    }

    // 2. Prevent repeated checkout
    if (occupancy.status !== 'ACTIVE') {
      throw new ConflictException(
        'Occupancy is not active',
      );
    }

    // 3. Complete occupancy and release bed atomically
    const result = await this.prisma.$transaction(
      async (tx) => {
        const completed = await tx.occupancy.updateMany({
          where: {
            id: occupancyId,
            status: 'ACTIVE',
          },
          data: {
            status: 'COMPLETED',
            checkOutDate: new Date(),
          },
        });

        if (completed.count !== 1) {
          throw new ConflictException(
            'Occupancy has already been completed',
          );
        }

        const releasedBed = await tx.bed.updateMany({
          where: {
            id: occupancy.bedId,
            status: 'OCCUPIED',
          },
          data: {
            status: 'AVAILABLE',
          },
        });

        if (releasedBed.count !== 1) {
          throw new ConflictException(
            'Bed could not be released',
          );
        }

        return tx.occupancy.findUnique({
          where: {
            id: occupancyId,
          },
          include: {
            tenant: true,
            bed: {
              include: {
                room: true,
              },
            },
          },
        });
      },
    );

    return {
      message: 'Tenant checked out successfully',
      occupancy: result,
    };
  }

  // GET TENANT OCCUPANCY HISTORY
  async getTenantHistory(
    organizationId: string,
    tenantId: string,
  ) {
    // 1. Verify tenant belongs to organization
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        organizationId,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // 2. Retrieve all occupancy records
    const occupancies =
      await this.prisma.occupancy.findMany({
        where: {
          tenantId: tenant.id,
        },
        include: {
          bed: {
            include: {
              room: {
                include: {
                  property: true,
                },
              },
            },
          },
        },
        orderBy: {
          checkInDate: 'desc',
        },
      });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        isActive: tenant.isActive,
      },
      total: occupancies.length,
      occupancies,
    };
  }
}

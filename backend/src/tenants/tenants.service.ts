
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE TENANT
  async create(
    organizationId: string,
    dto: CreateTenantDto,
  ) {
    const organization = await this.prisma.organization.findFirst({
      where: {
        id: organizationId,
        isActive: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Active organization not found');
    }

    const existingTenant = await this.prisma.tenant.findFirst({
      where: {
        organizationId,
        phone: dto.phone,
      },
    });

    if (existingTenant) {
      throw new ConflictException(
        'A tenant with this phone number already exists',
      );
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        organizationId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth
          ? new Date(dto.dateOfBirth)
          : undefined,
        address: dto.address,
        emergencyName: dto.emergencyName,
        emergencyPhone: dto.emergencyPhone,
      },
    });

    return {
      message: 'Tenant created successfully',
      tenant,
    };
  }

  // GET ALL TENANTS WITH PAGINATION AND FILTERING
  async findAll(
    organizationId: string,
    query: PaginationQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    // Validate status filter
    if (
      query.status &&
      !['active', 'inactive'].includes(query.status.toLowerCase())
    ) {
      throw new BadRequestException(
        'Status must be active or inactive',
      );
    }

    // Build database filters
    const where = {
      organizationId,

      ...(query.status
        ? {
            isActive: query.status.toLowerCase() === 'active',
          }
        : {}),

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
          }
        : {}),
    };

    // Execute count and data queries concurrently
    const [total, tenants] = await Promise.all([
      this.prisma.tenant.count({
        where,
      }),

      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: query.sortOrder ?? 'desc',
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      tenants,
      pagination: {
        totalRecords: total,
        currentPage: page,
        pageSize: limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  // GET SINGLE TENANT
  async findOne(
    organizationId: string,
    tenantId: string,
  ) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        organizationId,
      },
      include: {
        occupancies: {
          include: {
            bed: {
              include: {
                room: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  // UPDATE TENANT
  async update(
    organizationId: string,
    tenantId: string,
    dto: UpdateTenantDto,
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'At least one field is required',
      );
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        organizationId,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (dto.phone && dto.phone !== tenant.phone) {
      const existingTenant = await this.prisma.tenant.findFirst({
        where: {
          organizationId,
          phone: dto.phone,
          id: {
            not: tenantId,
          },
        },
      });

      if (existingTenant) {
        throw new ConflictException(
          'A tenant with this phone number already exists',
        );
      }
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth
          ? new Date(dto.dateOfBirth)
          : undefined,
      },
    });

    return {
      message: 'Tenant updated successfully',
      tenant: updatedTenant,
    };
  }

  // DEACTIVATE TENANT (SOFT DELETE)
  async deactivate(
    organizationId: string,
    tenantId: string,
  ) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        organizationId,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.isActive) {
      throw new ConflictException('Tenant is already inactive');
    }

    const activeOccupancy = await this.prisma.occupancy.findFirst({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
    });

    if (activeOccupancy) {
      throw new ConflictException(
        'Cannot deactivate a tenant with an active occupancy',
      );
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        isActive: false,
      },
    });

    return {
      message: 'Tenant deactivated successfully',
      tenant: updatedTenant,
    };
  }
}


import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics(organizationId: string) {
    const propertyFilter = {
      organizationId,
      isActive: true,
    };

    const bedScope = {
      room: {
        property: propertyFilter,
      },
    };

    const [
      totalProperties,
      totalRooms,
      totalBeds,
      availableBeds,
      occupiedBeds,
      activeTenants,
      activeOccupancies,
    ] = await Promise.all([
      // Total active properties
      this.prisma.property.count({
        where: propertyFilter,
      }),

      // Rooms belonging to active properties
      this.prisma.room.count({
        where: {
          property: propertyFilter,
          status: {
            not: 'INACTIVE',
          },
        },
      }),

      // Beds excluding inactive beds
      this.prisma.bed.count({
        where: {
          ...bedScope,
          status: {
            not: 'INACTIVE',
          },
        },
      }),

      // Available beds
      this.prisma.bed.count({
        where: {
          ...bedScope,
          status: 'AVAILABLE',
        },
      }),

      // Occupied beds
      this.prisma.bed.count({
        where: {
          ...bedScope,
          status: 'OCCUPIED',
        },
      }),

      // Active tenants
      this.prisma.tenant.count({
        where: {
          organizationId,
          isActive: true,
        },
      }),

      // Active occupancies
      this.prisma.occupancy.count({
        where: {
          status: 'ACTIVE',
          bed: bedScope,
        },
      }),
    ]);

    // Calculate occupancy percentage
    const usableBeds = availableBeds + occupiedBeds;

    const occupancyRate =
      usableBeds > 0
        ? Number(
            ((occupiedBeds / usableBeds) * 100).toFixed(2),
          )
        : 0;

    return {
      message: 'Dashboard statistics retrieved successfully',

      statistics: {
        totalProperties,
        totalRooms,
        totalBeds,
        availableBeds,
        occupiedBeds,
        activeTenants,
        activeOccupancies,
        occupancyRate,
      },
    };
  }
}

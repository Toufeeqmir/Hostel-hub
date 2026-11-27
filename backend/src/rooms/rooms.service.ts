
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE ROOM
  async create(
    organizationId: string,
    propertyId: string,
    dto: CreateRoomDto,
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

    const existingRoom = await this.prisma.room.findUnique({
      where: {
        propertyId_roomNumber: {
          propertyId,
          roomNumber: dto.roomNumber,
        },
      },
    });

    if (existingRoom) {
      throw new ConflictException(
        'Room number already exists in this property',
      );
    }

    const room = await this.prisma.room.create({
      data: {
        propertyId,
        roomNumber: dto.roomNumber,
        floor: dto.floor,
        capacity: dto.capacity,
        allowedGender: dto.allowedGender,
      },
    });

    return {
      message: 'Room created successfully',
      room,
    };
  }

  // GET ALL ROOMS
  async findAll(
    organizationId: string,
    propertyId: string,
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

    const rooms = await this.prisma.room.findMany({
      where: {
        propertyId: property.id,
      },
      orderBy: {
        roomNumber: 'asc',
      },
    });

    return {
      propertyId: property.id,
      totalRooms: rooms.length,
      rooms,
    };
  }

  // UPDATE ROOM
  async update(
    organizationId: string,
    propertyId: string,
    roomId: string,
    dto: UpdateRoomDto,
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

    if (dto.roomNumber && dto.roomNumber !== room.roomNumber) {
      const existingRoom = await this.prisma.room.findUnique({
        where: {
          propertyId_roomNumber: {
            propertyId,
            roomNumber: dto.roomNumber,
          },
        },
      });

      if (existingRoom) {
        throw new ConflictException(
          'Room number already exists in this property',
        );
      }
    }

    const updatedRoom = await this.prisma.room.update({
      where: {
        id: room.id,
      },
      data: dto,
    });

    return {
      message: 'Room updated successfully',
      room: updatedRoom,
    };
  }

  // DEACTIVATE ROOM
  async deactivate(
    organizationId: string,
    propertyId: string,
    roomId: string,
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

    const activeOccupancies = await this.prisma.occupancy.count({
      where: {
        bed: {
          roomId: room.id,
        },
        status: 'ACTIVE',
      },
    });

    if (activeOccupancies > 0) {
      throw new ConflictException(
        'Cannot deactivate a room with active occupants',
      );
    }

    const updatedRoom = await this.prisma.room.update({
      where: {
        id: room.id,
      },
      data: {
        status: 'INACTIVE',
      },
    });

    return {
      message: 'Room deactivated successfully',
      room: updatedRoom,
    };
  }
}

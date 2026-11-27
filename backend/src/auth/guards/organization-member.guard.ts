import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class OrganizationMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request.user;
    const organizationId = request.params.organizationId;

    if (!user?.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    const membership =
      await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: user.userId,
            organizationId,
          },
        },
      });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }

    request.organization = {
      id: membership.organizationId,
      role: membership.role,
    };

    return true;
  }
}
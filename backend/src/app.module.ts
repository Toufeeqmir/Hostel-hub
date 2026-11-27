
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { OrganizationsModule } from './organizations/organization.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { RoomsModule } from './rooms/room.module.js';
import { BedsModule } from './beds/beds.module.js';

export const { ObserveModule, ObserveInstrument } =
  createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),

    PrismaModule,
    AuthModule,
    OrganizationsModule,
    PropertiesModule,
    RoomsModule,
    BedsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

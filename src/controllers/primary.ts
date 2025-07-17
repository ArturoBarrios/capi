// src/controllers/primary.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('primary')
export class PrimaryController {
  constructor(private prisma: PrismaService) {}

  @Get()
  helloPrimary() {
    return { message: 'Hello from the primary controller' };
  }

  @Get('users')
  async getUsers() {
    return this.prisma.user.findMany({
      include: {
        likeObjects: true,
        jokes: true,
      },
    });
  }
}

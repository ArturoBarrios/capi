// src/controllers/primary.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('primary')
export class PrimaryController {
  constructor(private prisma: PrismaService) {}

  @Get('users')
  async getUsers() {
    const users = await this.prisma.user.findMany();
    return users;
  }
}

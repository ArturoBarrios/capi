import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrimaryController } from './controllers/primary';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { PrimaryService } from './services/primary.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes env vars available everywhere
    }),
  ],
  controllers: [PrimaryController],
  providers: [PrimaryService, PrismaService],
})
export class AppModule {}

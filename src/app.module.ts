import { Module } from '@nestjs/common';
import { PrimaryController } from './controllers/primary';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma/prisma.service';
import { PrimaryService } from './services/primary.service';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { AnalyzersController } from './controllers/analyzers';
import { AnalyzersService } from './services/analyzers.service';
import { AIService } from './services/ai.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes env vars available everywhere
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PrimaryController, AuthController, AnalyzersController],
  providers: [PrimaryService, AuthService, PrismaService, AnalyzersService, AIService],
})
export class AppModule {}

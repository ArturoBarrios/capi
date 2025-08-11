import { Module } from '@nestjs/common';
import { PrimaryController } from './controllers/primary';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma/prisma.service';
import { PrimaryService } from './services/primary.service';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { NewsController } from './controllers/news.controller';
import { BotsController } from './controllers/bots';
import { AnalyzersController } from './controllers/analyzers';
import { AnalyzersService } from './services/analyzers.service';
import { AIService } from './services/ai.service';
import { BotsService } from './services/bots.service';
import { ScheduleModule } from '@nestjs/schedule';
import { NewsService } from './services/news.service';
import { SocialMediaProfileController } from './controllers/social-media-profile.controller';
import { SocialMediaProfileService } from './services/social-media-profile.service';

@Module({
  imports: [
    ScheduleModule.forRoot(), 
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
  controllers: [PrimaryController, AuthController, AnalyzersController, BotsController, NewsController, SocialMediaProfileController],
  providers: [PrimaryService, AuthService, PrismaService, AnalyzersService, AIService, BotsService, NewsService, SocialMediaProfileService],
})
export class AppModule {}

import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('primary')
export class PrimaryController {
  constructor(private configService: ConfigService) {}

  @Get('port')
  getPort(): string {
    return this.configService.get<string>('PORT') ?? '3000';
  }
}
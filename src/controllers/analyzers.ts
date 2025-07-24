// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AnalyzersService } from '../services/analyzers.service';
import { CheckIntegrityDto } from '../dto/check-integrity.dto';
import { CheckIntegrityResponseDto } from '../dto/check-integrity.dto';

@Controller('analyzers')
export class AnalyzersController {
  constructor(private analyzersService: AnalyzersService) {}


  @Post('check-integrity')
  async checkIntegrity(@Body() dto: CheckIntegrityDto) {
    console.log("checkIntegrity called with:", dto);
    // Call the service method to check integrity
  const resp: CheckIntegrityResponseDto = 
    await this.analyzersService.checkIntegrity(dto);

  console.log("Integrity check completed, returned: "+ resp);
}
}

// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from 'src/dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: CreateUserDto) {
    console.log("signup called with:", dto);
    return this.authService.signup(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto) {
  return this.authService.login(dto);
}
}

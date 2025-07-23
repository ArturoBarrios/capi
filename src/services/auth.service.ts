// src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';

import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrimaryService } from '../services/primary.service'; 
import { LoginUserDto } from 'src/dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(    
    private jwtService: JwtService,
    private primaryService: PrimaryService
  ) {}

  async login(dto: LoginUserDto) {
  const user = await this.primaryService.getUserByUsername(dto.username);
  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const isValid = await bcrypt.compare(dto.password, user.password);
  if (!isValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const accessToken = this.jwtService.sign({ sub: user.id });
  const refreshToken = this.jwtService.sign(
    { sub: user.id },
    { expiresIn: '7d' }
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
    },
  };
}

  async signup(dto: CreateUserDto) {
    const existing = await this.primaryService.getUserByUsername(dto.username);
    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.primaryService.createUser({
      ...dto,
      password: hash,
    });

    const accessToken = this.jwtService.sign({ sub: user.id });
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d' } // refresh lasts longer
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }
}

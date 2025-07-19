import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { CreateJokeDto } from '../dto/create-joke.dto';
import { CreateLikeObjectDto } from '../dto/create-like-object.dto';

@Injectable()
export class PrimaryService {
  constructor(private prisma: PrismaService) {}

  async hasDuplicate(jokeId: string, userId: string) {
    return this.prisma.likeObject.findFirst({
      where: {
        jokeId,
        userId,
      },
    });
  }

  getUsers() {
    return this.prisma.user.findMany({
      include: {
        likeObjects: true,
        jokes: true,
      },
    });
  }

  async createJoke(dto: CreateJokeDto) {
  return this.prisma.joke.create({
    data: {
      content: dto.content,
      userId: dto.userId,
    },
  });
}

  async createUser(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        username: dto.username,
        password: dto.password,
        artificiallyCreated: dto.artificiallyCreated ?? true,
      },
      include: {
        likeObjects: true,
        jokes: true,
      },
    });
  }

  async createLikeObject(dto: CreateLikeObjectDto) {
  return this.prisma.likeObject.create({
    data: {
      liked: dto.liked,
      jokeId: dto.jokeId,
      userId: dto.userId,
    },
  });
}
  async updateLikeObject(dto: CreateLikeObjectDto,  dtoId: string ) {
  return this.prisma.likeObject.update({
    where: { id: dtoId },
    data: {
      liked: dto.liked,
      jokeId: dto.jokeId,
      userId: dto.userId,
    },
  });
}
}

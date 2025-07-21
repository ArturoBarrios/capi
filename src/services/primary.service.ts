import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { CreateJokeDto, UpdateJokeDto } from '../dto/create-joke.dto';
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

  async  deleteAllUsersAndJokes() {
  // Delete LikeObjects and JokeComments first (they depend on Joke/User)
  await this.prisma.likeObject.deleteMany({});
  await this.prisma.jokeComment.deleteMany({});
  // Remove relations between jokes and categories (if using many-to-many)
  // If you need to remove category relations, handle it via the join table or adjust your schema accordingly.
  // For now, just remove this updateMany call as 'categories' is not a valid field here.
  // Delete jokes
  await this.prisma.joke.deleteMany({});
  // Delete users
  await this.prisma.user.deleteMany({});
  console.log('All users and jokes deleted.');
}

  async createJoke(dto: CreateJokeDto) {
  return this.prisma.joke.create({
    data: {
      content: dto.content,
      userId: dto.userId,
    },
  });
}
  
async updateJoke(dto: UpdateJokeDto) {
  return this.prisma.joke.update({
    where: {
      id: dto.id,
    },
    data: {      
      categories: dto.categories
        ? {
            set: dto.categories.map((id: string) => ({ id }))
          }
        : undefined
    },
  });
}

  async createUser(dto: CreateUserDto) {
  // Check if user already exists by username
  const existingUser = await this.prisma.user.findFirst({
    where: { username: dto.username },
    include: {
      likeObjects: true,
      jokes: true,
    },
  });

  if (existingUser) {
    return existingUser;
  }

  // Otherwise, create new user
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

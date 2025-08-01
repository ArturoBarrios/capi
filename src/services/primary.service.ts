import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { CreateJokeDto, UpdateJokeDto } from '../dto/create-joke.dto';
import { CreateLikeObjectDto } from '../dto/create-like-object.dto';
import { CreateCategoryDto } from 'src/dto/create-category.dto';
import { CreateRetweetObjectDto } from 'src/dto/create-retweet-object.dto';
import { BotsService } from './bots.service';
import { UpdateGraphsDto } from 'src/dto/primary.dto';

@Injectable()
export class PrimaryService { 
  constructor(
    private prisma: PrismaService,

  ) {}

  async checkUsersOnline() {
    
  }

    async updateGraphs(dto: UpdateGraphsDto) {
        try{
    
        } catch (error) {
          console.error("Error updating graphs:", error);
          throw new Error("Error updating graphs");
        }
      }
    async updateSubGraphs(dto: UpdateGraphsDto) {
        try{
    
        } catch (error) {
          console.error("Error updating graphs:", error);
          throw new Error("Error updating graphs");
        }
      }
    

  async hasDuplicate(jokeId: string, userId: string) {
    return this.prisma.likeObject.findFirst({
      where: {
        jokeId,
        userId,
      },
    });
  }
  
  async hasDuplicateRetweet(jokeId: string, userId: string) {
    return this.prisma.retweet.findFirst({
      where: {
        jokeId,
        userId,
      },
    });
  }

  getUsers() {
    return this.prisma.user.findMany({
      where: {
        artificiallyCreated: false, 
      },
      include: {
        likeObjects: true,
        jokes: true,
      },
    });
  }

    getBotUsers() {
    return this.prisma.user.findMany({
      where: {
        artificiallyCreated: true,
        
      },
      
      include: {
        likeObjects: true,
        jokes: true,        
      },
    });
  }

  getUserByUsername(username: string) {
    return this.prisma.user.findFirst({
      where: { username: username },
      include: {
        likeObjects: true,
        jokes: true,
      },
    });
  }

  getJokes() { 
    console.log('Fetching all jokes');
    return this.prisma.joke.findMany({
      include: {
        user: true,
        categories: true,
        likeObjects: true,
        retweetObjects: true,
      },
    });
  }

  jokeSeenByUser(jokeId: string, userId: string){
    return this.prisma.joke.update({
      where: { id: jokeId },
      data: {
        jokeSeenByUserIds: {
          push: userId,
        },
      },
    });
  }

    getJokesForUser(userId: string) {
    return this.prisma.joke.findMany({
      where: { 
        forUsers: {
          has: userId
        },
        
        // NOT: {
        //   jokeSeenByUserIds: {
        //     has: userId
        //   }
        // }
      },
      include: {
        user: true,
        categories: true,
        likeObjects: true,
        retweetObjects: true,
      },
    });
  }

  deleteUsersByIds(userIds: string[]) {
    return this.prisma.user.deleteMany({
      where: {
        id: { in: userIds },
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
      categories: {
        connect: dto.categories?.map((id: string) => ({ id })),
      },
      forUsers: dto.forUsers || [], // Add forUsers field
    },
  });
}

async createCategory(dto: CreateCategoryDto){
  // Check if category already exists
  const existingCategory = await this.prisma.category.findFirst({
    where: { name: dto.name },
  });
  if (existingCategory) {
    return existingCategory;
  }
  return this.prisma.category.create({
    data: {
      name: dto.name,
    }
  })

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
  
async createRetweetObject(dto: CreateRetweetObjectDto) {
  return this.prisma.retweet.create({
    data: {
      retweeted: dto.retweeted,
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
  async updateRetweetObject(dto: CreateRetweetObjectDto,  dtoId: string ) {
  return this.prisma.retweet.update({
    where: { id: dtoId },
    data: {
      retweeted: dto.retweeted,
      jokeId: dto.jokeId,
      userId: dto.userId,
    },
  });
}
}

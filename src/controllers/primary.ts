// src/controllers/primary.controller.ts
import { Controller, Get, Post, Body } from "@nestjs/common";
import { PrimaryService } from "../services/primary.service";
import { CreateUserDto } from "../dto/create-user.dto";
import { UserResponseDto } from "../dto/user-response.dto";
import { CreateJokeDto, UpdateJokeDto } from "../dto/create-joke.dto";
import { JokeResponseDto } from "../dto/joke-response.dto";
import { CreateLikeObjectDto } from '../dto/create-like-object.dto';
import { LikeObjectResponseDto } from '../dto/like-object-response.dto';
import { ConfigService } from '@nestjs/config';

@Controller("primary")
export class PrimaryController {
  constructor(
    private configService: ConfigService,
    private primaryService: PrimaryService

  ) {}

  @Get("users")
  async getUsers() {
    return this.primaryService.getUsers();
  }

  @Post("delete-all-users-and-jokes")
  async deleteAllUsersAndJokes() {

    await this.primaryService.deleteAllUsersAndJokes();
    return { message: "All users and jokes deleted." };
  }

  @Post("users")
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const newUser = await this.primaryService.createUser(dto);

    return {
      id: newUser.id,
      username: newUser.username,
      password: newUser.password,
      artificiallyCreated: newUser.artificiallyCreated,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt ?? undefined,
      likeObjects: newUser.likeObjects || [],
      jokes: newUser.jokes || [],
    };
  }

  @Get("jokes")
  async getJokes() {
    return this.primaryService.getJokes();
  }
  
  @Post("jokes")
  async createJoke(@Body() dto: CreateJokeDto): Promise<JokeResponseDto> {
    const newJoke = await this.primaryService.createJoke(dto);

    return {
      id: newJoke.id,
      content: newJoke.content,
      createdAt: newJoke.createdAt,
      userId: newJoke.userId,
    };
  }
  @Post("update-jokes")
  async updateJokes(@Body() dto: UpdateJokeDto): Promise<JokeResponseDto> {
    const updatedJoke = await this.primaryService.updateJoke(dto);

    return {
      id: updatedJoke.id,
      content: updatedJoke.content,
      createdAt: updatedJoke.createdAt,
      userId: updatedJoke.userId,
    };
  }
@Post('like-objects')
async createLikeObject(@Body() dto: CreateLikeObjectDto): Promise<LikeObjectResponseDto> {
  const duplicate = await this.primaryService.hasDuplicate(dto.jokeId, dto.userId);
  if (duplicate) {
    if(duplicate.liked === dto.liked){
        return {
            id: duplicate.id,
            liked: duplicate.liked,
            response: "You already " + (dto.liked ? "liked" : "disliked") + " this joke",
        };
    }
    else{
        // If the like status is different, update the existing like object
        this.primaryService.updateLikeObject(dto, duplicate.id);
        return {
            id: duplicate.id,
            liked: dto.liked,
            response: "Like status updated",
        }
    }
  }

  const newLikeObject = await this.primaryService.createLikeObject(dto);
  return {
    id: newLikeObject.id,
    liked: newLikeObject.liked,
    response: "Like object created successfully",
    createdAt: newLikeObject.createdAt,
    updatedAt: newLikeObject.updatedAt,
    jokeId: newLikeObject.jokeId,
    userId: newLikeObject.userId,
  };
}




 
}

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
import { CreateRetweetObjectDto } from "src/dto/create-retweet-object.dto";
import { RetweetObjectResponseDto } from "src/dto/retweet-object-response.dto";
import { UpdateGraphsDto } from "src/dto/primary.dto";

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
    try {
      const userCount = await this.primaryService.getUsers().then(users => users.length);
      if (userCount <= 1000) {
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
          success: true,
          message: "User created successfully",
        };
      }
      else{
        return {
          success: false,
          message: "User limit reached. Cannot create more users right now.",
        
        }
      }

    } catch (error) {

      console.error("Error creating user:", error);
      
      return {
        success: false,
        message: "Error creating user: " + error.message,
      };
    }



  }

  @Get("jokes")
  async getJokes() {
    return this.primaryService.getJokes();
  }
  
  @Get("jokes-v2")
  async getJokesV2(@Body() dto: { userId: string }): Promise<JokeResponseDto[]> {
    //get id    
    console.log("Fetching jokesv2 for user:", dto.userId);
    return this.primaryService.getJokesForUser(dto.userId);
  }

    @Post("update-graphs")
    async updateGraphs(@Body() body: UpdateGraphsDto) {
      try{
  
      } catch (error) {
        console.error("Error updating graphs:", error);
        throw new Error("Error updating graphs");
      }
    }
  

  @Post("jokes")
  async createJoke(@Body() dto: CreateJokeDto): Promise<JokeResponseDto> {
    // ensure no more than 1000 jokes already exist
    const jokeCount = await this.primaryService.getJokes().then(jokes => jokes.length);
    if (jokeCount <= 1000) {
      const newJoke = await this.primaryService.createJoke(dto);
  
      return {
        id: newJoke.id,
        content: newJoke.content,
        createdAt: newJoke.createdAt,
        userId: newJoke.userId,        
      };

    }
    return {
      id: "",
      content: "",
      createdAt: new Date(),
      userId: "",      
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

@Post('retweet-objects')
async createRetweetObject(@Body() dto: CreateRetweetObjectDto): Promise<RetweetObjectResponseDto> {
  const duplicate = await this.primaryService.hasDuplicateRetweet(dto.jokeId, dto.userId);
  if (duplicate) {
    if(duplicate.retweeted === dto.retweeted){
        return {
            id: duplicate.id,
            retweeted: duplicate.retweeted,
            response: "You already " + (dto.retweeted ? "retweeted" : "unretweeted") + " this joke",
        };
    }
    else{
        // If the like status is different, update the existing like object
        this.primaryService.updateRetweetObject(dto, duplicate.id);
        return {
            id: duplicate.id,
            retweeted: dto.retweeted,
            response: "Retweeted status updated",
        }
    }
  }

  const newRetweetedObject = await this.primaryService.createRetweetObject(dto);
  return {
    id: newRetweetedObject.id,
    retweeted: newRetweetedObject.retweeted,
    response: "Retweet object created successfully",
    createdAt: newRetweetedObject.createdAt,    
    jokeId: newRetweetedObject.jokeId,
    userId: newRetweetedObject.userId,
  };
}




 
}

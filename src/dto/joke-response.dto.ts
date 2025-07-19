import { LikeObject } from "entities/like.dto";

// src/dto/joke-response.dto.ts
export class JokeResponseDto {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
}

export class JokeWithLikesResponseDto extends JokeResponseDto {
message: String;
likes: Number;
likeObjects: [LikeObject];
}

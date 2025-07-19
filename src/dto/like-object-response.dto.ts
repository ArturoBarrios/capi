// src/dto/like-object-response.dto.ts
export class LikeObjectResponseDto {
  id: string;
  liked: boolean;
  response: string; 
  createdAt?: Date;
  updatedAt?: Date;
  jokeId?: string;
  userId?: string;
}

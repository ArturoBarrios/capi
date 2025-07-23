// src/dto/like-object-response.dto.ts
export class RetweetObjectResponseDto {
  id: string;
  retweeted: boolean;
  response: string; 
  createdAt?: Date;
  updatedAt?: Date;
  jokeId?: string;
  userId?: string;
}

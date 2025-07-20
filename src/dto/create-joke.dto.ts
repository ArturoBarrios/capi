// src/dto/create-joke.dto.ts
export class CreateJokeDto {
  content: string;
  userId: string;
}

export class UpdateJokeDto {    
    id: string;
    categories?: string[];
}

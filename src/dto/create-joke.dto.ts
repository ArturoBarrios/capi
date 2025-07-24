// src/dto/create-joke.dto.ts
export class CreateJokeDto {
  content: string;
  userId: string;
  categories?: string[];
}

export class UpdateJokeDto {    
    id: string;
    categories?: string[];
}

export class MinimalJokeDto {
  id: string;
  content: string;
}

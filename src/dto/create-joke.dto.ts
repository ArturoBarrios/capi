// src/dto/create-joke.dto.ts
export class CreateJokeDto {
  content: string;
  userId: string;
  categories?: string[];
  isPublic?: boolean; // Optional field to indicate if the joke is public
  forUsers?: string[]; // Optional field to specify users for whom the joke is created
}

export class UpdateJokeDto {    
    id: string;
    categories?: string[];
}

export class MinimalJokeDto {
  id: string;
  content: string;
}

export class UserResponseDto {
  id: string;
  username: string;
  password: string;
  artificiallyCreated: boolean;
  createdAt: Date;
  updatedAt?: Date;
  likeObjects: any[]; // Optional: replace with LikeObjectResponseDto[]
  jokes: any[];       // Optional: replace with JokeResponseDto[]
}
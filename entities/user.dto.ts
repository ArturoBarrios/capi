// User DTO
import { LikeObject } from './like.dto'; // Adjust path as needed
import { Joke } from './joke.dto'; // Adjust path as needed
import { JokeComment } from './joke-comment.dto'; // Adjust path as needed

export class User {
  id: string;
  username: string;
  password: string;
  artificiallyCreated?: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  likeObjects?: LikeObject[];
  jokes?: Joke[];
  jokeComments?: JokeComment[];
}
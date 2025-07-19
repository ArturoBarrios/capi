// Joke DTO
import { User } from './user.dto'; // Adjust path as needed
import { LikeObject } from './like.dto'; // Adjust path as needed
import { Category } from './category.dto'; // Adjust path as needed
import { JokeComment } from './joke-comment.dto'; // Adjust path as needed

export class Joke {
  id: string;
  content: string;
  createdAt?: Date;

  userId: string;
  user?: User;

  likeObjects?: LikeObject[];
  jokeComments?: JokeComment[];
  categories?: Category[];
}
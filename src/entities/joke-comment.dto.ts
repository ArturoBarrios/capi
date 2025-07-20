import { User } from './user.dto'; // Adjust path as needed
import { Joke } from './joke.dto'; // Adjust path as needed

export class JokeComment {
  id: string;
  userId: string;
  jokeId: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;

  user?: User;
  joke?: Joke;
}
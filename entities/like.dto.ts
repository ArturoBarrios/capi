import { Joke } from './joke.dto'; // Adjust path as needed
import { User } from './user.dto'; // Adjust path as needed

export class LikeObject {
  id: string;
  liked: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  jokeId: string;
  userId: string;

  joke?: Joke;
  user?: User;
}
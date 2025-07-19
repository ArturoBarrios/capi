import { Joke } from './joke.dto'; // Adjust path as needed

export class Category {
  id: string;
  name: string;
  createdAt?: Date;

  jokes?: Joke[];
}
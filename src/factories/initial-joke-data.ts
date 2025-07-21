import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { CreateJokeDto } from 'src/dto/create-joke.dto';
import { UserResponseDto } from 'src/dto/user-response.dto';
import { JokeResponseDto } from 'src/dto/joke-response.dto';
import * as dotenv from 'dotenv';

dotenv.config();
const SITE_URL = process.env.SITE_URL || 'http://localhost:4000';
const SCRAPE_SITE_URL = process.env.SCRAPE_SITE_URL || 'http://localhost:8000';

const SCRAPED_JOKES_URL = SCRAPE_SITE_URL + '/get-scraped-jokes';
const USERS_ENDPOINT_URL = SITE_URL + '/primary/users';
const JOKES_ENDPOINT_URL = SITE_URL + '/primary/jokes';

export async function fetchAndSaveInitialJokeData() {
  try {
    console.log('Fetching jokes from endpoint...');
    const response = await axios.get(SCRAPED_JOKES_URL, { responseType: 'text' });
    const jokesText = response.data;

    const outputPath = path.join(process.cwd(), 'src', 'data', 'scraped-jokes.txt');
    fs.writeFileSync(outputPath, jokesText, { encoding: 'utf-8' });

    console.log(`Jokes data saved to ${outputPath}`);
    console.log('Starting to parse jokes...');

    // Parse and log category, username, and joke for each joke
    parseAndLogJokes(jokesText);

    console.log('Parsing complete.');
  } catch (error) {
    console.error('Failed to fetch or save jokes:', error);
  }
}

async function parseAndLogJokes(data: string) {
  const jokesArray: { category: string; username: string; joke: string }[] = [];
  const categoryBlocks = data.split('\n--- ').filter(Boolean);

  for (const block of categoryBlocks) {
    const firstLineEnd = block.indexOf('---');
    let categoryName = '';
    let jokesSection = block;
    if (firstLineEnd !== -1) {
      categoryName = block.slice(0, firstLineEnd).replace('.txt', '').trim();
      jokesSection = block.slice(firstLineEnd + 3).trim();
    } else {
      const firstLine = block.split('\n')[0];
      categoryName = firstLine.replace('.txt', '').trim();
      jokesSection = block.slice(firstLine.length).trim();
    }

    if (!categoryName) continue;

    const jokes = jokesSection.split(/\n(?=\[)/).filter(j => j.trim().length > 0);

    for (const jokeBlock of jokes) {
      const userMatch = jokeBlock.match(/User:\s*(@[^\n]+)/);
      const username = userMatch ? userMatch[1].trim() : '[No username]';

      const jokeLines = jokeBlock.split('\n');
      const userLineIdx = jokeLines.findIndex(line => line.startsWith('User:'));
      const jokeText = userLineIdx !== -1
        ? jokeLines.slice(userLineIdx + 1).join('\n').trim()
        : jokeBlock.trim();

      jokesArray.push({ category: categoryName, username, joke: jokeText });

      // Create user via API
      const createUserDto = {
        username: "Default",
        password: 'password',
        artificiallyCreated: true,
        createdAt: new Date().toISOString(),
      };
      let createdUser;
      try {
        const userRes = await axios.post(USERS_ENDPOINT_URL, createUserDto);
        createdUser = userRes.data;
      } catch (err) {
        console.error(`Failed to create user ${username}:`, err.response?.data || err.message);
        continue;
      }

      // Create joke via API
      const createJokeDto = {
        content: jokeText,
        userId: createdUser.id,
        // categories: [categoryId], // Add category support if needed
      };
      try {
        const jokeRes = await axios.post(JOKES_ENDPOINT_URL, createJokeDto);
        console.log('Created joke:', jokeRes.data);
      } catch (err) {
        console.error(`Failed to create joke for user ${username}:`, err.response?.data || err.message);
      }
    }
  }

  // Write result to scraped-jokes-results.txt
  const resultsPath = path.join(process.cwd(), 'src', 'data', 'scraped-jokes-results.txt');
  fs.writeFileSync(resultsPath, JSON.stringify(jokesArray, null, 2), { encoding: 'utf-8' });
  console.log(`Results written to ${resultsPath}`);
}

if (require.main === module) {
  fetchAndSaveInitialJokeData();
}
//node dist/factories/initial-joke-data.js
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// URL of the endpoint that returns the combined jokes text file
const SCRAPED_JOKES_URL = 'http://localhost:8000/get-scraped-jokes'; // Adjust port/host as needed

/**
 * Fetches jokes from the endpoint and saves them to a local file.
 */
export async function fetchAndSaveInitialJokeData() {
  try {
    const response = await axios.get(SCRAPED_JOKES_URL, { responseType: 'text' });
    const jokesText = response.data;

    const outputPath = path.join(process.cwd(), 'src', 'data', 'scraped-jokes.txt');
    fs.writeFileSync(outputPath, jokesText, { encoding: 'utf-8' });

    console.log(`Jokes data saved to ${outputPath}`);
  } catch (error) {
    console.error('Failed to fetch or save jokes:', error);
  }
}

// If run directly from terminal, execute the function
if (require.main === module) {
  fetchAndSaveInitialJokeData();
}
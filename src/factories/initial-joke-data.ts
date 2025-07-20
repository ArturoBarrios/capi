import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const SCRAPED_JOKES_URL = 'http://localhost:8000/get-scraped-jokes';

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

function parseAndLogJokes(data: string) {
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
    }
  }

  console.log('Parsed jokes array:', jokesArray);

  // Write result to scraped-jokes-results.txt
  const resultsPath = path.join(process.cwd(), 'src', 'data', 'scraped-jokes-results.txt');
  fs.writeFileSync(resultsPath, JSON.stringify(jokesArray, null, 2), { encoding: 'utf-8' });
  console.log(`Results written to ${resultsPath}`);
}

if (require.main === module) {
  fetchAndSaveInitialJokeData();
}
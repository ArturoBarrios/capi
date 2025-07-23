import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { PrimaryService } from "../services/primary.service";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { CreateCategoryDto } from "src/dto/create-category.dto";
import { CreateJokeDto } from "src/dto/create-joke.dto";

dotenv.config();

export async function fetchAndSaveInitialJokeData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const primaryService = app.get(PrimaryService);

  try {
    // Fetch jokes from your scraping endpoint (still using axios)
    const SCRAPE_SITE_URL =
      process.env.SCRAPE_SITE_URL || "http://localhost:8000";
    const SCRAPED_JOKES_URL = SCRAPE_SITE_URL + "/get-scraped-jokes";
    const response = await (
      await import("axios")
    ).default.get(SCRAPED_JOKES_URL, { responseType: "text" });
    const jokesText = response.data;

    const outputPath = path.join(
      process.cwd(),
      "src",
      "data",
      "scraped-jokes.txt"
    );
    fs.writeFileSync(outputPath, jokesText, { encoding: "utf-8" });

    console.log(`Jokes data saved to ${outputPath}`);
    console.log("Starting to parse jokes...");

    await parseAndLogJokes(jokesText, primaryService);

    console.log("Parsing complete.");
  } catch (error) {
    console.error("Failed to fetch or save jokes:", error);
  }
}

async function parseAndLogJokes(data: string, primaryService: PrimaryService) {
  const jokesArray: { category: string; username: string; joke: string }[] = [];
  const categoryBlocks = data.split("\n--- ").filter(Boolean);

  for (const block of categoryBlocks) {
    const firstLineEnd = block.indexOf("---");
    let categoryName = "";
    let jokesSection = block;
    if (firstLineEnd !== -1) {
      categoryName = block.slice(0, firstLineEnd).replace(".txt", "").trim();
      jokesSection = block.slice(firstLineEnd + 3).trim();
    } else {
      const firstLine = block.split("\n")[0];
      categoryName = firstLine.replace(".txt", "").trim();
      jokesSection = block.slice(firstLine.length).trim();
    }

    if (!categoryName) continue;

    const jokes = jokesSection
      .split(/\n(?=\[)/)
      .filter((j) => j.trim().length > 0);

    for (const jokeBlock of jokes) {
      const userMatch = jokeBlock.match(/User:\s*(@[^\n]+)/);
      const username = userMatch ? userMatch[1].trim() : "[No username]";

      const jokeLines = jokeBlock.split("\n");
      const userLineIdx = jokeLines.findIndex((line) =>
        line.startsWith("User:")
      );
      const jokeText =
        userLineIdx !== -1
          ? jokeLines
              .slice(userLineIdx + 1)
              .join("\n")
              .trim()
          : jokeBlock.trim();

      jokesArray.push({ category: categoryName, username, joke: jokeText });

      // Create or get user via service
      const createUserDto = {
        username: "@TheLaughFactory",
        password: "password",
        artificiallyCreated: true,
        createdAt: new Date().toISOString(),
      };
      let createdUser;
      try {
        createdUser = await primaryService.createUser(createUserDto);
      } catch (err) {
        console.error(`Failed to create user ${username}:`, err.message);
        continue;
      }

      // Create or get category via service
      console.log(`Creating category: ${categoryName}`);
      let createdCategory;
      const createdCategoryDto: CreateCategoryDto = {
        name: categoryName,
      };      

      try {
        createdCategory = await primaryService.createCategory(createdCategoryDto);
        console.log(`Created category: ${createdCategory}`);
      } catch (err) {
        console.error(
          `Failed to create category ${categoryName}:`,
          err.message
        );
        continue;
      }

      // Create joke via service
      const createJokeDto: CreateJokeDto = {
        content: jokeText,
        userId: createdUser.id,
        categories: [createdCategory.id],
      };
        console.log("createJokeDto: ", createJokeDto.categories)
      try {
        const jokeRes = await primaryService.createJoke(createJokeDto);
        console.log("Created joke:", jokeRes);
      } catch (err) {
        console.error(
          `Failed to create joke for user ${username}:`,
          err.message
        );
      }
    }
  }

  // Write result to scraped-jokes-results.txt
  const resultsPath = path.join(
    process.cwd(),
    "src",
    "data",
    "scraped-jokes-results.txt"
  );
  fs.writeFileSync(resultsPath, JSON.stringify(jokesArray, null, 2), {
    encoding: "utf-8",
  });
  console.log(`Results written to ${resultsPath}`);
}

if (require.main === module) {
  fetchAndSaveInitialJokeData();
}

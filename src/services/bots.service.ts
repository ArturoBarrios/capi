import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MinimalJokeDto } from "../dto/create-joke.dto";
import { AiCheckDto, AiCheckResponseDto } from "../dto/check-integrity.dto";
import axios from "axios";
import { PrimaryService } from "./primary.service";
import { AIService } from "./ai.service";
import { CreateBotsDto, DestroyBotsDto, StartBotsDto, StartBotInteractionsDto } from "src/dto/bots.dto";
import { CreateJokeDto } from "../dto/create-joke.dto";
import { Cron, CronExpression } from '@nestjs/schedule';


import * as fs from "fs";
import * as path from "path";
import { start } from "repl";

// stopBotInteractions {

// }

@Injectable()
export class BotsService {
  constructor(    
    private primaryService: PrimaryService,
    private aiService: AIService
  ) {} 


  // @Cron('*/1 * * * *') // Every minute for testing
  // @Cron('*/10 * * * * *') // Every 10 seconds
    // @Cron(CronExpression.EVERY_HOUR)    
  async runUserDataCreationService() {
    console.log("Running hourly user data creation service...");
    //analyze user data
    //create jokes based on user data
    //get jokes. 
    const users = await this.primaryService.getUsers();
    for (const user of users) {
        //can create data for users by users or by bots
        this.primaryService.getJokesForUser(user.id).then((jokes) => {
            if (jokes.length <  5) {
                console.log("niceeeeeee")
                //create jokes based on user data
                console.log("Processing user:", user.username);
            const startBotInteractionsDto: StartBotInteractionsDto = {
              userId: user.id,
              totalJokes: 5
            };
            this.createBotJokesOnData(startBotInteractionsDto).then((bots) => {
              console.log("Bot interactions started successfully with bots:", bots);
            }).catch((error) => {
              console.error("Error starting bot interactions:", error);
              throw new Error("Failed to start bot interactions");
            });
            
          }
        });
    }




  }

  async startBotInteractions(dto: StartBotInteractionsDto): Promise<any> {
    console.log("Starting bot interactions with DTO:", dto);
    //get stored data on user
    //this will usually be curated in the background
    const userId = dto.userId;
    const startBotsDto : StartBotInteractionsDto = {
      userId: userId,
      totalJokes: 5

    };
    await this.createBotJokesOnData(startBotsDto).then ((bots) => {
      console.log("Bot interactions started successfully with bots:", bots);
      
    }).catch((error) => {
      console.error("Error starting bot interactions:", error);
      throw new Error("Failed to start bot interactions");
    });


  }

  async checkUsersOnline() {

  }

    //entails user(s) are online....
//   async deliverJokesToUserAtShortInterval(){
//     //make jokes public
//     console.log("Starting joke delivery at 20-second intervals...");
    
//     const startBotsDto: StartBotsDto = {
//       jokesPerBot: 1, // Create 1 joke per bot each interval
//       read
      
//     };
    
//     // Create an interval that runs every 20 seconds (20000 milliseconds)
//     const intervalId = setInterval(async () => {
//       try {
//         console.log("Creating bot jokes on data...");
//         await this.createBotJokesOnData(startBotsDto);
//         console.log("Bot jokes created successfully");
//       } catch (error) {
//         console.error("Error in joke delivery interval:", error);
//       }
//     }, 20000);
    
//     // Store the interval ID for potential cleanup
//     // You might want to store this in a class property or database
//     console.log("Joke delivery interval started with ID:", intervalId);
    
//     return {
//       message: "Joke delivery interval started",
//       intervalId: intervalId,
//       intervalSeconds: 20
//     };
//   }



  //read data from various sources which eventually
  //will be used to create jokes
  /**
   * 
   * heuristics
   * get likes, retweets, comments, etc
   * see what is trending in data pools
   * create x things based on data
   * 
   */
  async createBotJokesOnData(startBotsDto: StartBotInteractionsDto) {
    //get x recent datapoints(right now in txt file)
    //create joke based on data and personality
    //get bots
    try {
      console.log("Fetching bots...");
      // Assuming you have a way to fetch bots, e.g., from the database
      const bots = await this.primaryService.getBotUsers();
      if (!bots || bots.length === 0) {
        console.log("No bots found.");
        return [];
      } else {
        console.log("Bots fetched successfully:", bots);
        const newsArticles: String[] = this.readNewsData();
        console.log("News articles fetched successfully:", newsArticles);
        if (newsArticles.length === 0) {
          console.log("No news articles found.");
          return [];
        }

        // Process each bot with each news article
        for (const bot of bots) {
          let i = 0;
          // for(let i = 0; i < startBotsDto.jokesPerBot; i++) {
          // if(!bot.isRunningBotInteractions){
          while (i < startBotsDto.totalJokes) { 
            for (const story of newsArticles) {
              try {
                const aiJokePrompt = this.createJokePrompt(
                  bot.botSenseOfHumorType || "default personality",
                  story.toString()
                );
                console.log("AI Joke Prompt created:", aiJokePrompt);
                //check joke with another ai service

                // TODO: Send this prompt to AI service to generate joke
                const aiJoke: string =
                  await this.aiService.createAIJoke(aiJokePrompt);
                console.log("AI Joke created:", aiJoke);
                // Save the joke to the database
                const createJokeDto: CreateJokeDto = {
                  content: aiJoke,
                  userId: bot.id,
                  isPublic: false,
                  categories: [], // You can add categories if needed
                  forUsers: [startBotsDto.userId]
                };
                const createdJoke =
                  await this.primaryService.createJoke(createJokeDto);
                console.log("Joke created successfully:", createdJoke);
                i++;
              } catch (error) {
                i = startBotsDto.totalJokes; // Stop the loop if an error occurs
                console.error(
                  "Error creating joke for bot:",
                  bot.username,
                  "Error:",
                  error
                );
              }
            }
          }
          // }
          // }
        }
      }

      console.log("Bots fetched successfully:", bots);
      return bots;
    } catch (error) {
      console.error("Error getting bots:", error);
      throw new Error("Failed to get bots");
    }
  }

  createJokePrompt(personality: string, story: string): string {
    const res: string = "";
    try {
      // Read the jokePrompts.txt file
      const filePath = path.join(process.cwd(), 'aiprompts' ,"createPrompts.txt");
      const fileContent = fs.readFileSync(filePath, "utf-8");

      // Extract content between JokePromptStart and JokePromptEnd
      const promptMatch = fileContent.match(
        /TakePromptStart\s*(.*?)\s*TakePromptEnd/s
      );

      if (promptMatch && promptMatch[1]) {
        let promptTemplate = promptMatch[1].trim();

        // Replace placeholders with actual values
        const aiJokePrompt = promptTemplate
          .replace("{personality}", personality)
          .replace("{story}", story);

        console.log("AI Joke Prompt created:", aiJokePrompt);
        return aiJokePrompt;
      } else {
        console.error("Joke prompt template not found in file.");
        return "Failed to create joke prompt";
      }
    } catch (error) {
      console.error("Error creating joke prompt:", error);
      return "Failed to create joke prompt";
    }
  }

  readNewsData(): string[] {
    try {
      // Read the scraped-news.txt file
      const filePath = path.join(process.cwd(), "scraped-news.txt");
      const fileContent = fs.readFileSync(filePath, "utf-8");

      // Split content by ArticleStartTag to get individual articles
      const articles = fileContent
        .split("ArticleStartTag")
        .filter((article) => article.trim() !== "");

      const summaries: string[] = [];

      for (const article of articles) {
        // Check if article contains ArticleEndTag
        if (article.includes("ArticleEndTag")) {
          // Extract the summary between summaryOfArticle: and ArticleEndTag
          const summaryMatch = article.match(
            /summaryOfArticle:\s*(.*?)\s*ArticleEndTag/s
          );

          if (summaryMatch && summaryMatch[1]) {
            summaries.push(summaryMatch[1].trim());
          }
        }
      }

      console.log(`Found ${summaries.length} article summaries`);
      return summaries;
    } catch (error) {
      console.error("Error reading news data:", error);
      throw new Error("Failed to read news data");
    }
  }

  createBots(createBotsDto: CreateBotsDto) {
    try {
      console.log("Creating bots with data:", createBotsDto);
      // Here you would implement the logic to create bots
      // For example, you might create a user and then associate it with a bot
      const user = this.primaryService.createUser(createBotsDto.user);

      // You can also add logic to create jokes or other entities associated with the bot
      console.log("Bot created successfully:", user);
      return user;
    } catch (error) {
      console.error("Error creating bots:", error);
      throw new Error("Failed to create bots");
    }
  }

  destroyBots(destroyBotsDto: DestroyBotsDto) {
    try {
      console.log("Destroying bots with data:", destroyBotsDto);

      const deletedUsers = this.primaryService.deleteUsersByIds(
        destroyBotsDto.userIds
      );

      console.log("Bots destroyed successfully:", deletedUsers);
      return deletedUsers;
    } catch (error) {
      console.error("Error destroying bots:", error);
      throw new Error("Failed to destroy bots");
    }
  }

  //perhaps you can create cron jobs to run these bots at specific intervals
  //one thing we could focus on is creating an env where bots are playing a role every now and then, should
  createJoke(createBotJokeDto: CreateJokeDto) {
    return this.primaryService.createJoke(createBotJokeDto);
  }

  // likeJokes(likeJokesDto: LikeJokesDto) {

  //     this.primaryService.likeJokes()

  // }

  // retweetJokes(retweetJokesDto: RetweetJokesDto) {
  //     this.primaryService.retweetJokes()

  // }

  //   updateBots(updateBotsDto: UpdateBotsDto) {}

  //looks at bot jokes
  analyzeBotJokes(analyzeBotsDto: any) {}

  //   findContent(){

  //   }

  //   stopBots(stopBotsDto: StopBotsDto) {}

  //   findJokesToAnalyze(findJokesToAnalyzeDto: FindJokesToAnalyzeDto) {
  //     //finds j
  //   }
}

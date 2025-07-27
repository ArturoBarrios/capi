import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MinimalJokeDto } from "../dto/create-joke.dto";
import { AiCheckDto, AiCheckResponseDto } from "../dto/check-integrity.dto";
import axios from "axios";
import { PrimaryService } from "./primary.service";
import { AIService } from "./ai.service";
import { CreateBotsDto, DestroyBotsDto } from "src/dto/bots.dto";
import { CreateJokeDto } from '../dto/create-joke.dto';

import * as fs from 'fs';
import * as path from 'path';




// stopBotInteractions {
    
// }

@Injectable()
export class BotsService {
    constructor(
        private prisma: PrismaService,
        private primaryService: PrimaryService,
        private aiService: AIService

    ) {}
    
    
    //group checks sound interesting
    async startBotInteractions() {
        //get x recent datapoints(right now in txt file)
        //create joke based on data and personality
        //get bots
        try {
            console.log("Fetching bots...");
            // Assuming you have a way to fetch bots, e.g., from the database
            const bots = await this.primaryService.getBotUsers(); 
            if(!bots || bots.length === 0) {
                console.log("No bots found.");
                return [];
            }
            else{
                console.log("Bots fetched successfully:", bots);
                const newsArticles : String[] = this.readNewsData();
                console.log("News articles fetched successfully:", newsArticles);
                if(newsArticles.length === 0) {
                    console.log("No news articles found.");
                    return [];
                }
                
                // Process each bot with each news article
                for (const bot of bots) {
                    for (const story of newsArticles) {
                        const aiJokePrompt = this.createJokePrompt(bot.botSenseOfHumorType || "default personality", story.toString());
                        console.log("AI Joke Prompt created:", aiJokePrompt);
                        // TODO: Send this prompt to AI service to generate joke
                    }
                }
            }

            console.log("Bots fetched successfully:", bots);
            return bots;
            

        } catch (error) {

            console.error("Error getting bots:", error);
            throw new Error("Failed to get bots");
        }
    }

    createJokePrompt(personality: string, story: string) {
        try {
            // Read the jokePrompts.txt file
            const filePath = path.join(process.cwd(), 'jokePrompts.txt');
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            
            // Extract content between JokePromptStart and JokePromptEnd
            const promptMatch = fileContent.match(/JokePromptStart\s*(.*?)\s*JokePromptEnd/s);
            
            if (promptMatch && promptMatch[1]) {
                let promptTemplate = promptMatch[1].trim();
                
                // Replace placeholders with actual values
                const aiJokePrompt = promptTemplate
                    .replace('{personality}', personality)
                    .replace('{story}', story);

                this.aiService.createAIJoke(aiJokePrompt);
                                
            } else {
                throw new Error("Could not find joke prompt template");
            }
            
        } catch (error) {
            console.error("Error creating joke prompt:", error);
            throw new Error("Failed to create joke prompt");
        }
    
    }

    readNewsData(): string[] {        
        try {
            // Read the scraped-news.txt file
            const filePath = path.join(process.cwd(), 'scraped-news.txt');
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            
            // Split content by ArticleStartTag to get individual articles
            const articles = fileContent.split('ArticleStartTag').filter(article => article.trim() !== '');
            
            const summaries: string[] = [];
            
            for (const article of articles) {
                // Check if article contains ArticleEndTag
                if (article.includes('ArticleEndTag')) {
                    // Extract the summary between summaryOfArticle: and ArticleEndTag
                    const summaryMatch = article.match(/summaryOfArticle:\s*(.*?)\s*ArticleEndTag/s);
                    
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

        const deletedUsers = this.primaryService.deleteUsersByIds
        (
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

//   findContent(){

//   }

//   stopBots(stopBotsDto: StopBotsDto) {}

//   findJokesToAnalyze(findJokesToAnalyzeDto: FindJokesToAnalyzeDto) {
//     //finds j
//   }

}


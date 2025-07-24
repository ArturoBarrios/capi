import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  AiCheckDto,
  AiCheckResponseDto,
  CheckIntegrityDto,
  CheckIntegrityResponseDto,
} from "../dto/check-integrity.dto";
import { AIService } from "./ai.service";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class AnalyzersService {
  constructor(
    private prisma: PrismaService,
    private ai: AIService
  ) {}

  async checkIntegrity(dto: CheckIntegrityDto): Promise<CheckIntegrityResponseDto> {
    try {
      // Query jokes within the given date range
      const jokes = await this.prisma.joke.findMany({
        where: {
          createdAt: {
            gte: new Date(dto.startDate),
            lte: new Date(dto.endDate),
          },
        },
        include: {
          user: true,
          categories: true,
          likeObjects: true,
          retweetObjects: true,
        },
      });
      console.log(
        `Found ${jokes.length} jokes between ${dto.startDate} and ${dto.endDate}`
      );
      const limitedJokes = jokes.slice(0, dto.limit ? dto.limit : jokes.length);
      if(limitedJokes.length === 0) {
        console.log("No jokes found in the specified date range.");
        return { success: false, message: "No jokes found in the specified date range." };
      }
      for (const joke of limitedJokes) {
        const isjoke = false;

        const promptTemplatePath = path.join(
          process.cwd(),
          "aiprompts",
          "IsItAJokePrompts",
          "prompt1.txt"
        );
        const promptTemplate = fs.readFileSync(promptTemplatePath, "utf8");

        const prompt = promptTemplate.replace("{{JOKE_CONTENT}}", joke.content);

        const aiCheckParams: AiCheckDto = {
          aiMessage: prompt,
        };
        console.log(
          `AI check for joke "${joke.content}" returned:`,
          aiCheckParams.aiMessage
        );
        //call service to check if joke is valid
        const aiJokeCheckResponse: AiCheckResponseDto =
          await this.ai.aiJokeCheck(aiCheckParams);
        console.log(
          `AI check confidence for joke "${joke.content}":`,
          aiJokeCheckResponse.score
        );        
      }

      return { 
        success: true,
        message: "Integrity check completed successfully.",
      }

    } catch (error) {
      console.error("Error checking integrity:", error);
      return {
        success: false,
      };
    }
  }
  async rateJokeWithAI() { 
    
  }
}

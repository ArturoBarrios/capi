import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MinimalJokeDto } from "../dto/create-joke.dto";
import { AiCheckDto, AiCheckResponseDto } from "../dto/check-integrity.dto";
import { CreateNewsDto, SimilarContentDto, GenerateNewsWithAI, GenerateNewsWithAIResponseDto } from "src/dto/news.dto";
import OpenAI from 'openai';

@Injectable()
export class AIService {
  constructor(private prisma: PrismaService) {}

  public readonly openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async createAIJoke(prompt: string): Promise<string> {
    console.log("Creating AI joke with prompt:", prompt);
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
      });

      console.log("OpenAI response:", response);

      if (response.choices && response.choices[0]?.message?.content) {
        return response.choices[0].message.content.trim();
      } else {
        return "Failed to create joke with AI";
      }
    } catch (error) {
      console.error("Error creating joke with AI:", error);
      return "Error creating joke with AI";
    }
  }

  async createNews(dto: CreateNewsDto): Promise<CreateNewsDto> {
    console.log("Creating AI news for:", dto.title);
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: dto.prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      console.log("OpenAI response:", response);

      if (response.choices && response.choices[0]?.message?.content) {
        try {
          const aiResponse = JSON.parse(response.choices[0].message.content.trim());
          
          dto.aiTitle = aiResponse.aiTitle || dto.title;
          dto.aiSummary = aiResponse.aiSummary || dto.summary;
          dto.success = true;
          
          console.log("AI-generated title:", dto.aiTitle);
          console.log("AI-generated summary:", dto.aiSummary);

          return dto;
          
        } catch (parseError) {
          console.error("Error parsing AI response:", parseError);
          
          // Try alternative parsing - extract values manually if JSON parsing fails
          const rawResponse = response.choices[0].message.content;
          const titleMatch = rawResponse.match(/"aiTitle":\s*"([^"]+)"/);
          const summaryMatch = rawResponse.match(/"aiSummary":\s*"([^"]+)"/);
          
          if (titleMatch && summaryMatch) {
            dto.aiTitle = titleMatch[1];
            dto.aiSummary = summaryMatch[1];
            dto.success = true;
            console.log("Extracted via regex - Title:", dto.aiTitle);
            console.log("Extracted via regex - Summary:", dto.aiSummary);
          } else {
            dto.aiTitle = dto.title;
            dto.aiSummary = dto.summary;
            dto.success = false;
          }
        }
      } else {
        dto.success = false;
      }

      return dto;

    } catch (error) {
      console.error("Error creating news with AI:", error);
      dto.success = false;
      return dto;
    }
  }

  async aiJokeCheck(dto: AiCheckDto): Promise<AiCheckResponseDto> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: dto.aiMessage
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
      });

      console.log("OpenAI response:", response);

      if (response.choices && response.choices[0]?.message?.content) {
        const aiResponseText = response.choices[0].message.content.trim();
        
        // Try to extract a numeric score from the response
        const scoreMatch = aiResponseText.match(/(\d+(?:\.\d+)?)/);
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
        
        return {
          success: true,
          message: "Joke checked successfully",
          score: score,
        };
      } else {
        return {
          success: false,
          message: "Failed to check joke with AI",
        };
      }
    } catch (error) {
      console.error("Error checking joke with AI:", error);
      return {
        success: false,
        message: "something went wrong with the AI service",
      };
    }
  }

  async generateNewsWithAI(dto: GenerateNewsWithAI): Promise<GenerateNewsWithAIResponseDto> {
    console.log("AI Service: Generating news with AI");
    try {
      // Ensure prompt is not undefined
      if (!dto.prompt) {
        throw new Error("Prompt is required");
      }

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: dto.prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      if (response.choices && response.choices[0]?.message?.content) {
        const aiResponse = response.choices[0].message.content.trim();
        console.log("Raw AI response:", aiResponse);

        // Extract JSON array from response
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error("Could not find valid JSON array in AI response");
        }

        const jsonString = jsonMatch[0];
        console.log("Extracted JSON string:", jsonString);

        try {
          const stories = JSON.parse(jsonString);
          
          // Validate the structure
          if (!Array.isArray(stories)) {
            throw new Error("AI response is not an array");
          }

          // Validate each story has required fields
          const validStories = stories.filter(story => 
            story.title && story.summary && story.publishedDate && 
            story.source && story.location && story.topic
          );

          if (validStories.length === 0) {
            throw new Error("No valid stories found in AI response");
          }

          return {
            success: true,
            message: `Successfully generated ${validStories.length} news stories`,
            stories: validStories,
          };
        } catch (parseError) {
          console.error("Failed to parse AI response as JSON:", parseError);
          return {
            success: false,
            message: "Failed to parse AI response",
            stories: [],
          };
        }
      } else {
        throw new Error("No response content from OpenAI");
      }
    } catch (error) {
      console.error("Error in AI service generateNewsWithAI:", error);
      return {
        success: false,
        message: "Error calling AI service",
        stories: [],
      };
    }
  }
}

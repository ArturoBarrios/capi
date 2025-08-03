import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MinimalJokeDto } from "../dto/create-joke.dto";
import { AiCheckDto, AiCheckResponseDto } from "../dto/check-integrity.dto";
import axios from "axios";
import { CreateNewsDto, SimilarContentDto } from "src/dto/news.dto";

@Injectable()
export class AIService {
  constructor(private prisma: PrismaService) {}

  private readonly ollamaUrl = "http://localhost:11434"; // Ollama's default port

  async createAIJoke(prompt: string): Promise<string> {
    console.log("Creating AI joke with prompt:", prompt);
    const res : string = "";
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: "llama3.2:3b",
        prompt: prompt,
        stream: false,
      });

      // Parse the AI response (you'll need to handle the actual response format)
      console.log("Ollama response:", response);

      if (response.status == 200 || response.statusText == "OK") {
        // For now, return a basic response
        return response.data.response; 
      } else {
        return "Failed to create joke with AI";
      }
    } catch (error) {
      console.error("Error creating joke with AI:", error);
      return "Error creating  with AI";
    }
  }
  
 

  async createNews(dto: CreateNewsDto): Promise<CreateNewsDto> {
    console.log("Creating AI news for:", dto.title);
    const res : string = "";
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: "llama3.2:3b",
        prompt: dto.prompt,
        stream: false,
      });

      // Parse the AI response (you'll need to handle the actual response format)
      console.log("Ollama response:", response.status);

      if (response.status == 200 || response.statusText == "OK") {
        // Parse the AI response to extract aiTitle and aiSummary
        try {
          const aiResponse = JSON.parse(response.data.response);
          
          // Populate the DTO with AI-generated content
          dto.aiTitle = aiResponse.aiTitle || dto.title; // Fallback to original title
          dto.aiSummary = aiResponse.aiSummary || dto.summary; // Fallback to original summary
          dto.success = true;
          
          console.log("AI-generated title:", dto.aiTitle);
          console.log("AI-generated summary:", dto.aiSummary);
          
        } catch (parseError) {
          console.error("Error parsing AI response:", parseError);
          console.log("Raw AI response:", response.data.response);
          
          // Keep original values if parsing fails
          dto.aiTitle = dto.title;
          dto.aiSummary = dto.summary;
          dto.success = false;
        }
        
        return dto; 
      } else {
        dto.success = false;
        return dto;
      }
    } catch (error) {
      console.error("Error creating news with AI:", error);
      dto.success = false;
      return dto;
    }
  }

  async aiJokeCheck(dto: AiCheckDto): Promise<AiCheckResponseDto> {
    // Query jokes within the given date range
    //make call to AI service to check if joke is valid
    //should you send one joke or many?

    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: "llama3.2:3b",
        prompt: dto.aiMessage,
        stream: false,
      });

      // Parse the AI response (you'll need to handle the actual response format)
      console.log("Ollama response:", response);

      if (response.status == 200 || response.statusText == "OK") {
        // For now, return a basic response
        return {
          success: true,
          message: "Joke checked successfully",
          score: response.data.response,
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
}

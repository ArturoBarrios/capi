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
    console.log("Creating AI news with:", dto);
    const res : string = "";
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: "llama3.2:3b",
        prompt: dto.prompt,
        stream: false,
      });

      // Parse the AI response (you'll need to handle the actual response format)
      console.log("Ollama response:", response);

      if (response.status == 200 || response.statusText == "OK") {
        dto.success = true;
        // For now, return a basic response
        return dto; 
      } else {
        return dto;
      }
    } catch (error) {
      console.error("Error creating news with AI:", error);
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

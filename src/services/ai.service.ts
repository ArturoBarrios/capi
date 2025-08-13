import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MinimalJokeDto } from "../dto/create-joke.dto";
import { AiCheckDto, AiCheckResponseDto } from "../dto/check-integrity.dto";
import axios from "axios";
import { CreateNewsDto, SimilarContentDto, GenerateNewsWithAI, GenerateNewsWithAIResponseDto } from "src/dto/news.dto";

@Injectable()
export class AIService {
  constructor(private prisma: PrismaService) {}

  private readonly ollamaUrl = "http://localhost:11434"; // Ollama's default port
  private readonly aiModelName = process.env.AIMODELNAME || "llama3.2:3b"; // Fallback to default

  async createAIJoke(prompt: string): Promise<string> {
    console.log("Creating AI joke with prompt:", prompt);
    const res : string = "";
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.aiModelName,
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
      let attempts = 3;
      let succeded = false;
    while (attempts > 0 && !succeded ) {
      console.log("attempt number ", (4 - attempts));
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.aiModelName,
        prompt: dto.prompt,
        stream: false,
      });
      console.log("Ollama response status:", response.status);
      console.log("Ollama response statusText:", response.statusText);
      if (response.status == 200 || response.statusText == "OK") {
        // Parse the AI response to extract aiTitle and aiSummary
        try {
          // Clean the response - remove any potential leading/trailing whitespace and non-printable characters
          let cleanResponse = response.data.response.trim();
          
          // Remove any non-printable characters
          cleanResponse = cleanResponse.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
          
          // Log the exact response for debugging
          console.log("Raw AI response length:", cleanResponse.length);
          console.log("Raw AI response:", cleanResponse);
          
          // Try to find and extract just the JSON part if there's extra text
          const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanResponse = jsonMatch[0];
            console.log("Extracted JSON:", cleanResponse);
          }
          
          // Additional cleanup: ensure the JSON is properly closed
          if (cleanResponse.startsWith('{') && !cleanResponse.endsWith('}')) {
            cleanResponse += '}';
          }
          
          const aiResponse = JSON.parse(cleanResponse);
          
          // Populate the DTO with AI-generated content
          dto.aiTitle = aiResponse.aiTitle || dto.title; // Fallback to original title
          dto.aiSummary = aiResponse.aiSummary || dto.summary; // Fallback to original summary
          dto.success = true;
          succeded = true; 
          
          console.log("AI-generated title:", dto.aiTitle);
          console.log("AI-generated summary:", dto.aiSummary);

          return dto; 
          
        } catch (parseError) {
          console.error("Error parsing AI response:", parseError);
          console.log("Raw AI response:", response.data.response);
          console.log("Response length:", response.data.response.length);
          
          // Try alternative parsing - extract values manually if JSON parsing fails
          const rawResponse = response.data.response;
          const titleMatch = rawResponse.match(/"aiTitle":\s*"([^"]+)"/);
          const summaryMatch = rawResponse.match(/"aiSummary":\s*"([^"]+)"/);
          
          if (titleMatch && summaryMatch) {
            dto.aiTitle = titleMatch[1];
            dto.aiSummary = summaryMatch[1];
            dto.success = true;
            console.log("Extracted via regex - Title:", dto.aiTitle);
            console.log("Extracted via regex - Summary:", dto.aiSummary);
          } else {
            // Keep original values if parsing fails completely
            dto.aiTitle = dto.title;
            dto.aiSummary = dto.summary;
            dto.success = false;
          }
        }
        
        
      } else {
        dto.success = false;
        
      }
      attempts--;
    }

    console.error("Failed to create news with AI after multiple attempts");
    dto.success = false;
    return dto;


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
        model: this.aiModelName,
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

  async generateNewsWithAI(dto: GenerateNewsWithAI): Promise<GenerateNewsWithAIResponseDto> {
    console.log("AI Service: Generating news with AI");
    try {
      const ollama_url = process.env.OLLAMA_URL;
      const aiModelName = process.env.AIMODELNAME || "llama3.2:3b";

      const response = await axios.post(`${ollama_url}/api/generate`, {
        model: aiModelName,
        prompt: dto.prompt,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false,
      });

      if (response.status === 200 || response.statusText === "OK") {
        const aiResponse = response.data.response;
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
        throw new Error(`AI service returned status: ${response.status}`);
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

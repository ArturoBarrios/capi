// src/auth/auth.controller.ts
import { Controller, Post, Body, Get } from "@nestjs/common";
import { CreateNewsDto, GetNewsContentDto, GetNewsForAnalysisDto, NewsDto, SimilarContentDto } from "src/dto/news.dto";
import { NewsService } from "src/services/news.service";
import { AIService } from "src/services/ai.service";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("news")
export class NewsController {
  constructor(
    private aiService: AIService,
    private newsService: NewsService,
    private prisma: PrismaService
  ) {}



  @Get("get-news-content")
  async getNewsContent() {
    console.log("Fetching news...");
    let getNewsContentDto : GetNewsContentDto = {
      success: false,
    };
    await this.newsService.getNewsContent(getNewsContentDto);
  }


  @Post("generate-news")
  async generateNews(@Body() body: any) {
    console.log("Running generateNews...");
    const singularNews = await this.prisma.news.findFirst({
                orderBy: {
                    createdAt: "desc",
                },
                });
    if (!singularNews) {
      throw new Error("No news found to generate analysis.");
    }
    let generateNewsDto: GetNewsForAnalysisDto = {
      success: false,
      id: singularNews.id,
    }
    this.newsService.generateContent(generateNewsDto);
  }

  
  /**
   * todo
   * 
   */

  @Post("create")
  async createNews(@Body() body: any) {
    console.log("Running createNews...");
    
    
    const aiNewsPrompt = `Based on this specific story, create an improved title and summary. 
      Original Title: ${body.title}
      Original Summary: ${body.summary || ""}
      Original Content: ${body.content}

      Requirements:
      - Create a concise, engaging title (10 words or less)
      - Create a great summary that captures the essence of the story (100 words or less)
      - Make both compelling and informative

      Return only a JSON object with this exact format:
      {
        "aiTitle": "your improved title here",
        "aiSummary": "your improved summary here"
      }`;

    const createAINewsDto: CreateNewsDto = {
      title: body.title,
      summary: body.summary,
      content: body.content,
      aiTitle: "",
      aiSummary: "",
      prompt: aiNewsPrompt,
      success: false,
    };
    const createdResponse: CreateNewsDto =
      await this.aiService.createNews(createAINewsDto);
      //populate aititle and aisummary
    console.log("Created AI news response:", createdResponse.aiTitle, createdResponse.aiSummary);

    if (createdResponse.success) {
      console.log("AI news created successfully:", createdResponse);
      await this.newsService.createNews(createdResponse);
      return {
        success: true,
        message: "News created successfully",
        news: createdResponse,
      };

    } else {
      throw new Error("Title and content are required to create news.");
    }


    //returns information, can nudge scraper to do more work
  }
}

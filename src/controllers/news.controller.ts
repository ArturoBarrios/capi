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

  @Get("without-content")
  async getNewsWithoutContent() {
    console.log("Fetching news without content...");
    try {
      const newsWithoutContent = await this.prisma.news.findMany({
        where: {
          newsContent: {
            none: {}
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      return {
        success: true,
        message: "News without content fetched successfully",
        count: newsWithoutContent.length,
        news: newsWithoutContent,
      };
    } catch (error) {
      console.error("Error fetching news without content:", error);
      return {
        success: false,
        message: "Error fetching news without content",
        news: [],
      };
    }
  }

  @Post("get-news")
  async getNews(@Body() body: any) {
    console.log("Fetching news...");
    
   
  }

  @Post("get-news-content")
  async getNewsContent(@Body() body: any) {
    console.log("Fetching news...");
    try {
      let getNewsContentDto : GetNewsContentDto = {
        success: false,
        startDate: body.startDate,
      };
      const result = await this.newsService.getNewsContent(getNewsContentDto);
      let res = {
        success: true,
        message: "News content fetched successfully",
        newsContents: result,

      }
      return res;
    } catch (error) {
      console.error("Error in getNewsContent controller:", error);
      return {
        success: false,
        message: "Error fetching news content",
        newsContents: [],
      };
    }
  }


  @Post("generate-news")
  async generateNews(@Body() body: any) {
    
    console.log("Running generateNews...");
    let singularNews;
    
    if (body.newsId) {
      singularNews = await this.prisma.news.findFirst({
        where: {
          id: body.newsId,
        },
      });
    } else {
      singularNews = await this.prisma.news.findFirst({
        orderBy: {
          createdAt: "desc",
        },
      });
    }
    
    if (!singularNews) {
      throw new Error("No news found to generate analysis.");
    }
    let generateNewsDto: GetNewsForAnalysisDto = {
      success: false,
      id: singularNews.id,
    }
    console.log("Generating news for analysis with ID:", generateNewsDto.id);
    this.newsService.generateContent(generateNewsDto);
  }

  
  /**
   * todo
   * 
   */

  @Post("scrape-nytimes")
  async scrapeNYTimes() {
    console.log("Triggering NYTimes scraping...");
    try {
      const result = await this.newsService.scrapeNYTimes();
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      console.error("Error in scrapeNYTimes controller:", error);
      return {
        success: false,
        message: "Error scraping NYTimes articles",
      };
    }
  }

  @Post("create")
  async createNews(@Body() body: any) {
    console.log("Running createNews...");
    
    // Create chopped content (every third sentence)
    const sentences = body.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const choppedContent = sentences
      .filter((_, index) => index % 3 === 0)
      .join('. ') + '.';


    const aiNewsPrompt = `Based on this specific story, create an improved title and summary. 
      Original Title: ${body.title}
      Original Summary: ${body.summary || ""}
      Original Content: ${body.choppedContent}

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

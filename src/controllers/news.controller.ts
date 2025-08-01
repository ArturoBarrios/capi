// src/auth/auth.controller.ts
import { Controller, Post, Body, Get } from "@nestjs/common";
import { CreateNewsDto, GetNewsContentDto, NewsDto, SimilarContentDto } from "src/dto/news.dto";
import { NewsService } from "src/services/news.service";
import { AIService } from "src/services/ai.service";

@Controller("news")
export class NewsController {
  constructor(
    private aiService: AIService,
    private newsService: NewsService
  ) {}



  @Get("get-news-content")
  async getNewsContent() {
    console.log("Fetching news...");
    let getNewsContentDto : GetNewsContentDto = {
      success: false,
    };
    await this.newsService.getNewsContent(getNewsContentDto);
  }


  // @Post("generate-news-content")
  // async createNewsContent(@Body() body: any) {
  //   console.log("Creating news content...");
  //   try {
  //     //could sort based on body, defaulting to news connections
  //     const newsDtos: GetNewsDto = await this.newsService.getNews();
  //     if (!newsDtos || !newsDtos.NewsDto || newsDtos.NewsDto.length === 0) {
  //       throw new Error("No news available to generate content.");
  //     } else {
  //       console.log("News available for content generation.");
  //       for (const newsDto of newsDtos.NewsDto) {
  //         console.log(`Generating content for news: ${newsDto.title}`);
  //         // Here you would call an AI service to generate content based on the news
  //         //gather and connect information
  //         //create a linear matrix, so that all stories
  //         // are compared and compiled into scores, which
  //         //will be used for further analysis because
  //         //stored linear algebra data from news is extremely useful
  //         // await this.newsService.deleteUnusableNewsData()
  //         let similarContentDto : SimilarContentDto = {
  //           id: newsDto.id,
  //           title: newsDto.title,
  //           content: newsDto.content,
  //           similarNewsContentIds: [],
  //           success: false
  //         };
  //         const findSimilarExistingContent : SimilarContentDto = await this.newsService.findSimilarExistingContent(similarContentDto);
  //         if (findSimilarExistingContent.success) {
  //           console.log("Similar content found:", findSimilarExistingContent);
  //           similarContentDto = findSimilarExistingContent;
  //         } else { 
  //           console.log("No similar content found for:", newsDto.title);
  //         }
  //         await this.newsService.updateGraphs(newsDto);
  //         // aiStoryComparisonNews();
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error creating news content:", error);
  //     throw new Error("Error creating news content");
  //   }

  //   // This method is not used in the controller, but can be used to generate content
  //   // for news articles using AI or other methods.
  //   return "This is a placeholder for news content generation.";
  // }
  
  /**
   * todo
   * 
   */

  @Post("create")
  async createNews(@Body() body: any) {
    console.log("Running createNews...");
    if (!body || !body.title || !body.content) {
      throw new Error("Title and content are required to create news.");
    }
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

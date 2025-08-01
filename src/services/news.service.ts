import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MinimalJokeDto } from "../dto/create-joke.dto";
import { AiCheckDto, AiCheckResponseDto } from "../dto/check-integrity.dto";
import axios from "axios";
import { CreateNewsDto, GetNewsContentDto, GetNewsForAnalysisDto, NewsDto, SimilarContentDto } from "src/dto/news.dto";

@Injectable()
export class NewsService {
    newsService: NewsService;
  constructor(private prisma: PrismaService) {}


async getSingularNews(id: string): Promise<NewsDto> {
    try {
        const news = await this.prisma.news.findUnique({
            where: { id },
        });
        if (!news) {
            throw new Error("News not found");
        }
        return {
            id: news.id,
            title: news.title,
            summary: news.summary,
            content: news.content,
            aiTitle: news.aiTitle ?? "",
            aiSummary: news.aiSummary ?? "",
            createdAt: news.createdAt,
            updatedAt: news.updatedAt === null ? undefined : news.updatedAt,
        };
    } catch (error) {
        console.error("Error fetching singular news:", error);
        throw new Error("Error fetching singular news");
    }
}
//analyzes and updates or creates news content
  async analyzeNews(getNewsForAnalysisDto : GetNewsForAnalysisDto): Promise<GetNewsForAnalysisDto> {
    try{
            console.log("Fetching news for analysis...");
            let newsDto : NewsDto = await this.getSingularNews(getNewsForAnalysisDto.id);
            let similarContentDto : SimilarContentDto = {
                id: getNewsForAnalysisDto.id,
                title: newsDto.title,
                content: newsDto.content, 
                success: false,
            }
            // const findSimilarExistingContent : SimilarContentDto = await this.newsService.findSimilarExistingContent(similarContentDto);
            
            // update or create content


        
        const news = await this.prisma.news.findMany({
            
            orderBy: {
                createdAt: "desc",
            },

        })
        const mappedNews : NewsDto[]  = news.map((n) => ({
            id: n.id,
            title: n.title,
            summary: n.summary,
            content: n.content,
            aiTitle: n.aiTitle ?? "",
            aiSummary: n.aiSummary ?? "",
            createdAt: n.createdAt,
            updatedAt: n.updatedAt === null ? undefined : n.updatedAt,
        }));
       
        return getNewsForAnalysisDto;
    } catch (error) {
        console.error("Error fetching news content:", error);
        return getNewsForAnalysisDto


    }

  }
  async getNewsContent(getNewsContentDto : GetNewsContentDto): Promise<GetNewsContentDto> {
    try{
        
        const newsContent = await this.prisma.newsContent.findMany({
            include: {
                news: true,
            },
            orderBy: {
                createdAt: "desc",
            },

        })
        const resultNewsContentDto : GetNewsContentDto = {
            success: true,
            message: "News content fetched successfully",
            newsContents: newsContent,
        }
        return resultNewsContentDto;
    } catch (error) {
        console.error("Error fetching news content:", error);
        return {
            success: false,
            message: "Error fetching news content",
            newsContents: [],
        };


    }

  }


  async deleteUnusableNewsData(): Promise<string> {
    console.log("Deleting unusable news data...");
    try {
      // Implement logic to delete unusable news data
    } catch (error) {
      console.error("Error deleting unusable news data:", error);
      return "Error deleting unusable news data";
    }
    return "Unusable news data deleted successfully";
  }

  async createNews(newsDto: CreateNewsDto): Promise<string> {
    console.log("Creating News: ", newsDto);
    try {
      await this.prisma.news.create({
        data: {
          title: newsDto.title,
          summary: newsDto.summary,
          content: newsDto.content,
          aiTitle: newsDto.aiTitle,
          aiSummary: newsDto.aiSummary,
        },
      });
      console.log("News created successfully:", newsDto.title);
      return "News created successfully";
    } catch (error) {
      console.error("Error creating news:", error);
      return "Error creating news";
    }
  }

  async updateGraphs(): Promise<string> {
    console.log("Grouping news by similarity...");
    try {
      // theoretically, compare every article, and represent
      //look at ai summarized graphs so queries don't look at entire articles
    } catch (error) {
      console.error("Error grouping news by similarity:", error);
      return "Error grouping news by similarity";
    }
    return "News grouped by similarity successfully";
  }

  async aiNewsCheck(dto: AiCheckDto): Promise<String> {
    // Query jokes within the given date range
    //make call to AI service to check if joke is valid
    //should you send one joke or many?

    try {
      return "";
    } catch (error) {
      return "Error checking news integrity";
    }
  }
}

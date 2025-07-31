import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MinimalJokeDto } from "../dto/create-joke.dto";
import { AiCheckDto, AiCheckResponseDto } from "../dto/check-integrity.dto";
import axios from "axios";
import { CreateNewsDto, GetNewsDto, NewsDto, SimilarContentDto } from "src/dto/news.dto";

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}


  async getNewsContent(): Promise<GetNewsContentDto> {
    try{
        const newsContent = await this.prisma.newsContent.findMany({
            include: {
                news: true,
            },
            orderBy: {
                createdAt: "desc",
            },

        })
    } catch (error) {

    }

  }
  async getNews(): Promise<GetNewsDto> {
    console.log("Fetching news from the database...");

    try {
      const newsData = await this.prisma.news.findMany({
        include: {
          newsConnected: true,
          _count: {
            select: {
              newsConnected: true,
            },
          },
        },
        orderBy: [
          {
            newsConnected: {
              _count: "desc",
            },
          },
          {
            createdAt: "desc",
          },
        ],
      });

      const newsDto: NewsDto[] = newsData.map((news) => ({
        id: news.id,
        title: news.title,
        summary: news.summary,
        content: news.content,
        aiTitle: news.aiTitle ?? "",
        aiSummary: news.aiSummary ?? "",
        createdAt: news.createdAt,
        updatedAt: news.updatedAt === null ? undefined : news.updatedAt,
      }));

      return {
        success: true,
        message: "News fetched successfully",
        NewsDto: newsDto,
      };
    } catch (error) {
      console.error("Error fetching news:", error);
      return {
        success: false,
        message: "Error fetching news",
        NewsDto: [],
      };
    }
  }

   async findSimilarExistingContent(similarContentDto : SimilarContentDto): Promise<SimilarContentDto> {
    console.log("Finding similar existing content for title:", similarContentDto.title);
    try{

        similarContentDto.success = true;
        return similarContentDto;
    } catch (error) {
        similarContentDto.success = false;
      console.error("Error finding similar existing content:", error);
        return similarContentDto;
     
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

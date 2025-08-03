import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MinimalJokeDto } from "../dto/create-joke.dto";
import { AiCheckDto, AiCheckResponseDto } from "../dto/check-integrity.dto";
import axios from "axios";
import {
  CreateNewsDto,
  GetNewsContentDto,
  GetNewsForAnalysisDto,
  NewsDto,
  SimilarContentDto,
} from "src/dto/news.dto";
import * as dotenv from "dotenv";

dotenv.config();

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
  /**
   * current assumptions: 
   * aiTitle and aiSummary exist 
   * prompts might be too long, in which case......
   *    to truly make this dynamic, we need an additional prompt
   *    to create a list of x properties that will be output for new content
   *    you can also add a prompt for content to destroy, update, create, or other suggestions
   */
  async generateContent(
    getNewsForAnalysisDto: GetNewsForAnalysisDto
  ): Promise<GetNewsForAnalysisDto> {
    try {
      console.log("Fetching news for analysis...");
      let newsDto: NewsDto = await this.getSingularNews(
        getNewsForAnalysisDto.id
      );
      let similarContentDto: SimilarContentDto = {
        id: getNewsForAnalysisDto.id,
        title: newsDto.aiTitle,
        summary: newsDto.aiSummary,
        success: false,
      };
      //similar stories
      let similarContent = [];

      const news = await this.prisma.news.findMany({
        where: {
          id: {
            not: getNewsForAnalysisDto.id, // Exclude the current article being analyzed
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      const mappedNews: NewsDto[] = news.map((n) => ({
        id: n.id,
        title: n.title,
        summary: n.summary,
        content: n.content,
        aiTitle: n.aiTitle ?? "",
        aiSummary: n.aiSummary ?? "",
        createdAt: n.createdAt,
        updatedAt: n.updatedAt === null ? undefined : n.updatedAt,
      }));

      console.log("Similar content found:", similarContent);

      const storiesForComparison = mappedNews.map((article, index) => ({
        index: index,
        aiSummary: article.aiSummary,
      }));

      const prompt = `You are analyzing news similarity. Compare the target story against the provided stories and return a JSON array of 1s and 0s.
        TARGET STORY:
        Title: "${newsDto.aiTitle}"
        Summary: "${newsDto.aiSummary}"
        Content: "${newsDto.content}"

        STORIES TO COMPARE:
        ${JSON.stringify(storiesForComparison, null, 2)}

        INSTRUCTIONS:
        - Return ONLY a JSON array of numbers
        - Use 1 if the story at that index is similar to the target story
        - Use 0 if the story at that index is NOT similar to the target story
        - Consider stories similar if they cover the same event, topic, or subject matter
        - The array length should match the number of stories provided (${mappedNews.length} items)

        EXAMPLE FORMAT: [0, 1, 0, 1, 0]

        Response:`;

      console.log("AI Prompt created for similarity analysis");

      const ollama_url = process.env.OLLAMA_URL;
      const response = await axios.post(`${ollama_url}/run`, {
        model: "llama2",
        prompt: prompt,
        temperature: 0.5,
        max_tokens: 1000,
        stream: false,
      });
      console.log("Ollama response:", response.data);
      if (response.status === 200 || response.statusText === "OK") {
        const similarityScores = response.data.response;
        console.log("Similarity scores:", similarityScores);

        // Parse the similarity scores
        const scoresArray = JSON.parse(similarityScores);
        similarContentDto.similarNewsContentIds = scoresArray
          .map((score, index) => (score === 1 ? mappedNews[index].id : null))
          .filter((id) => id !== null);
        //create news content......
        // Get the similar stories based on the similarity scores
        const similarStories = scoresArray
        .map((score, index) => score === 1 ? mappedNews[index] : null)
        .filter(story => story !== null);

        const newsContentPrompt = `Analyze the target story and similar stories to create important context and identify controversies.
                If Similar stories are provided, use them to enhance the analysis.
                If no similar stories are found, focus on the target story alone.
                TARGET STORY:
                Title: "${newsDto.title}"
                Summary: "${newsDto.summary}"
                Content: "${newsDto.content}"

                SIMILAR STORIES:
                ${JSON.stringify(similarStories.map(story => ({
                title: story.title,
                aiSummary: story.aiSummary
                })), null, 2)}

                TASK:
                Create 2 key points that provide important context about this story, and 2 key points about controversies or disagreements people are having related to this topic.

                INSTRUCTIONS:
                - Analyze the target story and similar stories
                - Provide context that helps readers understand the bigger picture
                - Identify specific areas of controversy or disagreement
                - Return ONLY a JSON object with the exact format below

                REQUIRED JSON FORMAT:
                {
                "contextPoints": [
                    "First key context point that provides important background or context",
                    "Second key context point that adds crucial understanding"
                ],
                "controversyPoints": [
                    "First point about what people are disagreeing about or finding controversial",
                    "Second point about areas of conflict or debate around this topic"
                ]
                }

                Response:`;

        console.log("AI Prompt created for news content analysis");
        const newsContentResponse = await axios.post(`${ollama_url}/run`, {
          model: "llama2",
          prompt: newsContentPrompt,
          temperature: 0.5,
          max_tokens: 1000,
          stream: false,
        });
        console.log("Ollama response for news content:", newsContentResponse.data);
        if (newsContentResponse.status === 200 || newsContentResponse.statusText === "OK") {
          const newsContentData = newsContentResponse.data.response;
          const newsContentJson = JSON.parse(newsContentData);
          console.log("News content analysis result:", newsContentJson);   

          // Create NewsContent object
          const newsContent = await this.prisma.newsContent.create({
            data: {
              title: newsDto.aiTitle,
              summary: newsDto.aiSummary,
              news: {
                connect: { id: newsDto.id } // Connect to the original News article
              }
            }
          });

          console.log("NewsContent created:", newsContent.id);

                    // Create SubContent for each property in the JSON response
          for (const [key, value] of Object.entries(newsContentJson)) {
            if (Array.isArray(value)) {
              // Iterate through each item in the array
              for (const item of value) {
                await this.prisma.subContent.create({
                  data: {
                    content: item,
                    type: key, // Use the actual property name (contextPoints, controversyPoints, etc.)
                    newsContentId: newsContent.id
                  }
                });
              }
            }
          }

          console.log("All SubContent records created successfully");
          similarContentDto.success = true;
        } else {
          console.error("Failed to get news content analysis from AI");
        }
      

    }
    return getNewsForAnalysisDto;
    } catch (error) {
      console.error("Error fetching news content:", error);
      return getNewsForAnalysisDto;
    }
  }
  async getNewsContent(
    getNewsContentDto: GetNewsContentDto
  ): Promise<GetNewsContentDto> {
    try {
      const newsContent = await this.prisma.newsContent.findMany({
        include: {
          news: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      const resultNewsContentDto: GetNewsContentDto = {
        success: true,
        message: "News content fetched successfully",
        newsContents: newsContent,
      };
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

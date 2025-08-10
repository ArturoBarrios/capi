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
  private readonly aiModelName = process.env.AIMODELNAME || "llama3.2:3b"; // Fallback to default

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
      console.log("Fetching similar news stories for analysis...");
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

      let storiesForComparison = mappedNews.map((article, index) => ({
        index: index,
        aiSummary: article.aiSummary,
      }));
      storiesForComparison = [];
      console.log("Stories for comparison:", storiesForComparison);
      const ollama_url = process.env.OLLAMA_URL;
      let similarStories: any[] = [];
      if (storiesForComparison.length == 0) {
        const prompt = `Compare the target story to each comparison story. Return a JSON array where each number corresponds to one comparison story.
    
            TARGET STORY: "${newsDto.aiTitle}" - "${newsDto.aiSummary}"
            
            COMPARISON STORIES:
            ${storiesForComparison
              .map((story, idx) => `${idx}: "${story.aiSummary}"`)
              .join("\n")}
            
            Return exactly ${mappedNews.length} numbers (one for each comparison story):
            - 1 = similar to target story
            - 0 = not similar to target story
            
            Format: [${Array(mappedNews.length).fill("0").join(", ")}]
            
            Response:`;

        console.log("AI Prompt created for similarity analysis: ", prompt);

        
        const response = await axios.post(`${ollama_url}/api/generate`, {
          model: this.aiModelName,
          prompt: prompt,
          temperature: 0.5,
          max_tokens: 1000,
          stream: false,
        });
        
        console.log("Ollama response:", response.data);
        if (response.status === 200 || response.statusText === "OK") {
          const similarityScores = response.data.response;
          console.log("Similarity scores:", similarityScores);

          // Extract JSON array from response that may contain additional text
          const jsonMatch = similarityScores.match(/\[[^\]]*\]/);
          if (!jsonMatch) {
            throw new Error("Could not find valid JSON array in AI response");
          }
          const jsonString = jsonMatch[0];
          console.log("Extracted JSON string:", jsonString);

          // Parse the similarity scores
          const scoresArray = JSON.parse(jsonString);
          similarContentDto.similarNewsContentIds = scoresArray
            .map((score, index) => (score === 1 ? mappedNews[index].id : null))
            .filter((id) => id !== null);
          //create news content......
          // Get the similar stories based on the similarity scores
          similarStories = scoresArray
            .map((score, index) => (score === 1 ? mappedNews[index] : null))
            .filter((story) => story !== null);
        }
      }
      //aaa
      
      const newsContentPrompt = `Analyze the target story and similar stories to create important context and identify controversies.
                If Similar stories are provided, use them to enhance the analysis.
                If no similar stories are found, focus on the target story alone.
                TARGET STORY:
                Title: "${newsDto.title}"
                Summary: "${newsDto.summary}"
                Content: "${newsDto.content}"

                SIMILAR STORIES:
                 No Similar Stories Found

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
      const newsContentResponse = await axios.post(
        `${ollama_url}/api/generate`,
        {
          model: this.aiModelName,
          prompt: newsContentPrompt,
          temperature: 0.5,
          max_tokens: 1000,
          stream: false,
        }
      );
      console.log(
        "Ollama response for news content:",
        newsContentResponse.data
      );
      if (
        newsContentResponse.status === 200 ||
        newsContentResponse.statusText === "OK"
      ) {
        const newsContentData = newsContentResponse.data.response;
        console.log("Raw news content data:", newsContentData);

        let newsContentJson;
        let shouldCreateContent = false;

        try {
          // Find the start of the JSON object
          const startIndex = newsContentData.indexOf("{");
          if (startIndex === -1) {
            console.log(
              "Could not find opening brace in AI response, skipping content creation"
            );
            throw new Error("Could not find valid JSON object in AI response");
          }

          // Extract everything from the opening brace to the end
          let jsonString = newsContentData.substring(startIndex);
          console.log("Extracted JSON string (raw):", jsonString);

          // Try to find a natural ending point or complete the JSON
          let braceCount = 0;
          let endIndex = -1;

          for (let i = 0; i < jsonString.length; i++) {
            if (jsonString[i] === "{") {
              braceCount++;
            } else if (jsonString[i] === "}") {
              braceCount--;
              if (braceCount === 0) {
                endIndex = i + 1;
                break;
              }
            }
          }

          if (endIndex > 0) {
            // We found a complete JSON object
            jsonString = jsonString.substring(0, endIndex);
          } else {
            // JSON is incomplete, try to complete it
            console.log("JSON appears incomplete, attempting to complete it");

            // Remove any trailing non-JSON content (like newlines, extra text)
            jsonString = jsonString.replace(/[^}\]"]*$/, "");

            // If we have unclosed arrays, close them
            const openSquareBrackets = (jsonString.match(/\[/g) || []).length;
            const closeSquareBrackets = (jsonString.match(/\]/g) || []).length;

            for (let i = 0; i < openSquareBrackets - closeSquareBrackets; i++) {
              jsonString += "]";
            }

            // If we have unclosed quotes, close them
            const quotes = (jsonString.match(/"/g) || []).length;
            if (quotes % 2 !== 0) {
              jsonString += '"';
            }

            // Ensure we have a closing brace
            if (!jsonString.endsWith("}")) {
              jsonString += "}";
            }
          }

          console.log("Final JSON string:", jsonString);

          // Parse directly without modification first
          try {
            newsContentJson = JSON.parse(jsonString);
            shouldCreateContent = true;
          } catch (directParseError) {
            console.log("Direct parse failed, attempting additional fixes");
            console.log("Parse error:", directParseError.message);

            // Additional cleanup attempts
            let fixedJson = jsonString;

            // Remove trailing commas before closing brackets/braces
            fixedJson = fixedJson.replace(/,(\s*[\]}])/g, "$1");

            // Try again
            try {
              newsContentJson = JSON.parse(fixedJson);
              shouldCreateContent = true;
            } catch (secondParseError) {
              console.log(
                "Second parse attempt failed:",
                secondParseError.message
              );
              throw secondParseError;
            }
          }

          // Validate the structure
          if (
            !newsContentJson.contextPoints ||
            !Array.isArray(newsContentJson.contextPoints)
          ) {
            console.log(
              "Invalid contextPoints structure, skipping content creation"
            );
            shouldCreateContent = false;
          }
          if (
            !newsContentJson.controversyPoints ||
            !Array.isArray(newsContentJson.controversyPoints)
          ) {
            console.log(
              "Invalid controversyPoints structure, skipping content creation"
            );
            shouldCreateContent = false;
          }

          // Check if arrays have meaningful content
          const hasValidContext = newsContentJson.contextPoints?.some(
            (point) => typeof point === "string" && point.trim().length > 0
          );
          const hasValidControversy = newsContentJson.controversyPoints?.some(
            (point) => typeof point === "string" && point.trim().length > 0
          );

          if (!hasValidContext || !hasValidControversy) {
            console.log(
              "No valid content points found, skipping content creation"
            );
            shouldCreateContent = false;
          }
        } catch (parseError) {
          console.error("Failed to parse AI response as JSON:", parseError);
          console.log("Skipping content creation due to parse failure");
          shouldCreateContent = false;
        }

        if (shouldCreateContent) {
          console.log("News content analysis result:", newsContentJson);

          // Create NewsContent object
          const newsContent = await this.prisma.newsContent.create({
            data: {
              title: newsDto.aiTitle,
              summary: newsDto.aiSummary,
              news: {
                connect: { id: newsDto.id }, // Connect to the original News article
              },
            },
          });

          console.log("NewsContent created:", newsContent.id);

          // Create SubContent for each property in the JSON response
          for (const [key, value] of Object.entries(newsContentJson)) {
            if (Array.isArray(value)) {
              // Iterate through each item in the array
              for (const item of value) {
                if (typeof item === "string" && item.trim().length > 0) {
                  await this.prisma.subContent.create({
                    data: {
                      content: item,
                      type: key, // Use the actual property name (contextPoints, controversyPoints, etc.)
                      newsContentId: newsContent.id,
                    },
                  });
                }
              }
            }
          }

          console.log("All SubContent records created successfully");
          similarContentDto.success = true;
        } else {
          console.log(
            "Content creation skipped due to invalid or missing AI analysis"
          );
        }
      } else {
        console.error("Failed to get news content analysis from AI");
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
      const whereClause = getNewsContentDto.startDate
        ? { createdAt: { gte: new Date(getNewsContentDto.startDate) } }
        : {};

      const newsContent = await this.prisma.newsContent.findMany({
        where: whereClause,
        include: {
          subContent: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      const resultNewsContentDto: GetNewsContentDto = {
        success: true,
        message: "News content fetched successfully",
        newsContents: newsContent,
        startDate: getNewsContentDto.startDate,
      };
      return resultNewsContentDto;
    } catch (error) {
      console.error("Error fetching news content:", error);
      return {
        startDate: getNewsContentDto.startDate,
        success: false,
        message: "Error fetching news content",
        newsContents: [],
      };
    }
  }

  async scrapeNYTimes(): Promise<string> {
    console.log("Scraping NYTimes articles...");
    try {
      const scrapeUrl = process.env.SCRAPE_SITE_URL;
      if (!scrapeUrl) {
        throw new Error("SCRAPE_SITE_URL environment variable not set");
      }

      const response = await axios.post(`${scrapeUrl}/scrape-nytimes`);

      if (response.status === 200) {
        console.log("NYTimes scraping completed successfully");
        return "NYTimes articles scraped successfully";
      } else {
        throw new Error(`Scraping failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error scraping NYTimes:", error);
      return "Error scraping NYTimes articles";
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

  async deleteNews(newsId: string): Promise<string> {
    console.log("Deleting news with ID:", newsId);
    try {
      // Check if news exists
      const news = await this.prisma.news.findUnique({
        where: { id: newsId },
      });

      if (!news) {
        throw new Error("News not found");
      }

      // Delete the news
      await this.prisma.news.delete({
        where: { id: newsId },
      });

      console.log("News deleted successfully:", newsId);
      return "News deleted successfully";
    } catch (error) {
      console.error("Error deleting news:", error);
      throw new Error("Error deleting news");
    }
  }

  async deleteNewsContent(newsContentId: string): Promise<string> {
    console.log("Deleting news content with ID:", newsContentId);
    try {
      // Check if news content exists
      const newsContent = await this.prisma.newsContent.findUnique({
        where: { id: newsContentId },
        include: {
          subContent: true,
        },
      });

      if (!newsContent) {
        throw new Error("News content not found");
      }

      // First delete all associated subcontent
      if (newsContent.subContent.length > 0) {
        await this.prisma.subContent.deleteMany({
          where: {
            newsContentId: newsContentId,
          },
        });
        console.log(
          `Deleted ${newsContent.subContent.length} subcontent records`
        );
      }

      // Then delete the news content
      await this.prisma.newsContent.delete({
        where: { id: newsContentId },
      });

      console.log("News content deleted successfully:", newsContentId);
      return "News content and associated subcontent deleted successfully";
    } catch (error) {
      console.error("Error deleting news content:", error);
      throw new Error("Error deleting news content");
    }
  }

  async deleteSubContent(subContentId: string): Promise<string> {
    console.log("Deleting subcontent with ID:", subContentId);
    try {
      // Check if subcontent exists
      const subContent = await this.prisma.subContent.findUnique({
        where: { id: subContentId },
      });

      if (!subContent) {
        throw new Error("Subcontent not found");
      }

      // Delete the subcontent
      await this.prisma.subContent.delete({
        where: { id: subContentId },
      });

      console.log("Subcontent deleted successfully:", subContentId);
      return "Subcontent deleted successfully";
    } catch (error) {
      console.error("Error deleting subcontent:", error);
      throw new Error("Error deleting subcontent");
    }
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

export class CreateNewsDto {
    title: string;
    summary: string;
    content: string;  
    aiTitle: string; 
    aiSummary: string;
    topic?: string; // Optional topic field for categorization
    prompt: string;
    success: boolean;

}

export class GenerateNewsWithAI {
    topic: string;
    numberOfArticles: number;
    location: string;
    success: boolean;
    message?: string; 
    prompt?: string;
}

export class GetNewsForAnalysisDto {
    success: boolean;
    message?: string;     
    id: string;
    newsDto?: NewsDto[];
}
export class GetNewsContentDto {
    success: boolean;
    message?: string; 
    startDate: Date;
    newsContents?: any[];
}

export class NewsDto {
    id: string;
    title: string;
    summary: string;
    content: string;
    aiSummary: string;
    aiTitle: string;
    createdAt: Date;
    updatedAt?: Date;
}

export class SimilarContentDto {
    id: string;
    title: string;
    summary: string;
    similarNewsContentIds?: String[]; 
    success: boolean;
}

export class GeneratedNewsStoryDto {
    title: string;
    summary: string;
    content: string;
    publishedDate: string;
    source: string;
    location: string;
    topic: string;
}

export class GenerateNewsWithAIResponseDto {
    success: boolean;
    message?: string;
    stories?: GeneratedNewsStoryDto[];
}



export class CreateNewsDto {
    title: string;
    summary: string;
    content: string;  
    aiTitle: string; 
    aiSummary: string;
    prompt: string;
    success: boolean;
}

export class GetNewsDto {
    success: boolean;
    message?: string; 
    NewsDto: NewsDto[];
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
    title: string;
    content: string;
    similarNewsContentIds: String[]; 
    success: boolean;
}

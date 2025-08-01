export class CreateNewsDto {
    title: string;
    summary: string;
    content: string;  
    aiTitle: string; 
    aiSummary: string;
    prompt: string;
    success: boolean;
}

export class GetNewsForAnalysisDto {
    success: boolean;
    message?: string; 
    forAnalysis? : boolean;
    id: string;
    newsDto?: NewsDto[];
}
export class GetNewsContentDto {
    success: boolean;
    message?: string; 
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
    content: string;
    similarNewsContentIds?: String[]; 
    success: boolean;
}



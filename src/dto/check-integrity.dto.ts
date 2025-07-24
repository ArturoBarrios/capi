export class CheckIntegrityDto {
    startDate: string;
    endDate: string;
    requestMessageNumber: number; //in request to indicate message to use
    limit? : number;
}

export class CheckIntegrityResponseDto {
    success: boolean;
    message?: string;   
}

export class AiCheckResponseDto {
    success: boolean;
    message?: string;   
    score?: number; 
}

export class AiCheckDto {
    aiMessage: string;        
}


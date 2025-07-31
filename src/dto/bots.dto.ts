import { CreateUserDto } from "./create-user.dto";

export class CreateBotsDto {
    user : CreateUserDto;
    
}

export class DestroyBotsDto {
    userIds: [string];
}

export class StartBotsDto {
    jokesPerBot: number;
    readNewsInterval: number;
    
}

export class StartBotInteractionsDto {
    userId: string;
    totalJokes: number;
    interval?: number;
    botSenseOfHumorType?: string;
    queueUrl?: string;
}




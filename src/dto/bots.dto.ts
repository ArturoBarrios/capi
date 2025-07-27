import { CreateUserDto } from "./create-user.dto";

export class CreateBotsDto {
    user : CreateUserDto;
    
}

export class DestroyBotsDto {
    userIds: [string];
}




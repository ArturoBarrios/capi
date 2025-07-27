import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsDateString,
} from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  username: string;

  @IsString()
  password: string;

  botSenseOfHumorType?: String //you are 27 years old, doing great in life, you are a know it all, you are a liberal, etc....

  @IsOptional()
  @IsBoolean()
  artificiallyCreated?: boolean;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @IsOptional()
  @IsArray()
  likeObjects?: any[]; // You can replace `any` with a LikeObject DTO later

  @IsOptional()
  @IsArray()
  jokes?: any[]; // You can replace `any` with a Joke DTO later
}

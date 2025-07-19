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

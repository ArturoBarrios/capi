import { Controller, Post, Body } from '@nestjs/common';
import { SocialMediaProfileService } from '../services/social-media-profile.service';
import { CreateProfilePostDto } from '../dto/social-media-profile.dto';

@Controller('socialmedia')
export class SocialMediaProfileController {
  constructor(private readonly socialMediaProfileService: SocialMediaProfileService) {}

  @Post('create-post')
  async createProfilePost(@Body() createProfilePostDto: CreateProfilePostDto) {
    console.log("Creating profile post with data:", createProfilePostDto);
    return this.socialMediaProfileService.createProfilePost(createProfilePostDto);
  }
}
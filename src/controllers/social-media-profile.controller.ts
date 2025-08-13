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

  @Post('delete-post')
  async deletePost(@Body() body: { id: string }) {
    console.log("Deleting post with ID:", body.id);
    
    if (!body.id) {
      throw new Error("Post ID is required");
    }
    
    return this.socialMediaProfileService.deletePost(body.id);
  }

  @Post('delete-post-and-account')
  async deletePostAndAccount(@Body() body: { postId: string }) {
    console.log("Deleting post and social media account for post ID:", body.postId);
    
    if (!body.postId) {
      throw new Error("Post ID is required");
    }
    
    return this.socialMediaProfileService.deletePostAndAccount(body.postId);
  }
}
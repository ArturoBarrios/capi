import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfilePostDto } from '../dto/social-media-profile.dto';

@Injectable()
export class SocialMediaProfileService {
  constructor(private prisma: PrismaService) {}

  async createProfilePost(createProfilePostDto: CreateProfilePostDto) {
    console.log('Creating profile post with data:', createProfilePostDto);
    
    // First, find or create the SocialMediaAccount
    console.log(`Searching for existing social media account - Platform: ${createProfilePostDto.platform}, Username: ${createProfilePostDto.socialMediaUsername}`);
    let socialMediaAccount = await this.prisma.socialMediaAccount.findFirst({
      where: {
        platform: createProfilePostDto.platform,
        username: createProfilePostDto.socialMediaUsername,
      },
    });

    if (!socialMediaAccount) {
      console.log('No existing social media account found, creating new one');
      socialMediaAccount = await this.prisma.socialMediaAccount.create({
        data: {
          platform: createProfilePostDto.platform,
          username: createProfilePostDto.socialMediaUsername,
        },
      });
      console.log('Created new social media account:', socialMediaAccount);
    } else {
      console.log('Found existing social media account:', socialMediaAccount);
    }

    // Create the Post
    console.log('Creating post with social media account ID:', socialMediaAccount.id);
    const post = await this.prisma.post.create({
      data: {
        socialMediaAccountId: socialMediaAccount.id,
        newsContentId: createProfilePostDto.newsContentId,
        content: createProfilePostDto.content,
      },
    });
    console.log('Created post:', post);

    const result = {
      socialMediaAccount,
      post,
      success: createProfilePostDto.success,
      message: createProfilePostDto.message,
    };
    console.log('Returning result:', result);
    
    return result;
  }
}
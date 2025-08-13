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

  async deletePost(postId: string): Promise<string> {
    console.log("Deleting post with ID:", postId);
    try {
      // Check if post exists
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new Error("Post not found");
      }

      // Delete the post
      await this.prisma.post.delete({
        where: { id: postId },
      });

      console.log("Post deleted successfully:", postId);
      return "Post deleted successfully";
    } catch (error) {
      console.error("Error deleting post:", error);
      throw new Error("Error deleting post");
    }
  }

  async deletePostAndAccount(postId: string): Promise<string> {
    console.log("Deleting post and social media account for post ID:", postId);
    try {
      // First, get the post with its social media account
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        include: {
          socialMediaAccount: true,
        },
      });

      if (!post) {
        throw new Error("Post not found");
      }

      const socialMediaAccountId = post.socialMediaAccountId;

      // Delete the post first
      await this.prisma.post.delete({
        where: { id: postId },
      });
      console.log("Post deleted successfully:", postId);

      // Then delete the social media account
      await this.prisma.socialMediaAccount.delete({
        where: { id: socialMediaAccountId },
      });
      console.log("Social media account deleted successfully:", socialMediaAccountId);

      return "Post and social media account deleted successfully";
    } catch (error) {
      console.error("Error deleting post and social media account:", error);
      throw new Error("Error deleting post and social media account");
    }
  }
}
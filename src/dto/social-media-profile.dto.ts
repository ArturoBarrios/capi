export class CreateProfilePostDto {
    socialMediaUsername: string;
    content: string;
    createdPostAt: Date;
    platform: string;
    link: string;
    newsContentId: string;
    success: boolean;
    message?: string;
}



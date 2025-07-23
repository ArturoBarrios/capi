import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const cmarket = process.env.CMARKET_SITE_URL;
  app.enableCors({
    origin: cmarket, //allow requests from cmarket site
    credentials: true, // if you need cookies/auth
  });
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Server running at: http://localhost:${port}`);
}
bootstrap();

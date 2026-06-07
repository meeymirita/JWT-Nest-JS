import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './utils/swagger.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser.default());
  app.useGlobalPipes(new ValidationPipe());
  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

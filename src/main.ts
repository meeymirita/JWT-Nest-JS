import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log(process.env['DATABASE_URL']);

  // swagger
  const config = new DocumentBuilder()
    .setTitle('Nest API title')
    .setDescription('Nest API description')
    .setVersion('1.0.0')
    .setContact(
      'mirita mikami',
      'https://nestjs.com',
      'mirita.mikami@gmail.com',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: '/api-json',
    yamlDocumentUrl: '/api-yaml',
    customSiteTitle: 'Nest API',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

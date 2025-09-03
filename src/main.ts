import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
var session = require('express-session');
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const FrontEndURL = configService.get('FRONTEND_URL');
  app.enableCors({
    origin: FrontEndURL,
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });
  app.set('query parser', 'extended');

  // const config = new DocumentBuilder()
  //   .setTitle('DocsHub API')
  //   .setDescription('The docsHub API')
  //   .setVersion('1.0')
  //   .addTag('docsHub')
  //   .build();
  // const documentFactory = () => SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api', app, documentFactory);
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin:[ config.get('FRONTEND_URL')|| 'http://localhost:3000'],
    credentials: true,
    methods:['GET','POST','PUT','DELETE','PATCH'],
    allowHeaders:['Content-Type','Authorization'],});

    app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true ,forbidNonWhitelisted: true,transform: true}));
  app.useGlobalFilters(new HttpExceptionFilter());
  const port = config.get('PORT') || 3001;
  await app.listen(port);
  console.log(`Backend API → http://localhost:${port}/api`);
}
bootstrap();

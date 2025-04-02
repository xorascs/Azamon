import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RabbitMQExceptionFilter } from './rabbitmq-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('/api');
  app.useGlobalFilters(new RabbitMQExceptionFilter());
  await app.listen(process.env.PORT as string);
}
bootstrap();

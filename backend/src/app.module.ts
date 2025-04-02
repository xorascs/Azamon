import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ElasticModule } from './elastic/elastic.module';
import { RedisModule } from './redis/redis.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { EventsModule } from './events/events.module';
import { ProductsModule } from './products/products.module';
import { RatingModule } from './rating/rating.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CategoriesModule } from './categories/categories.module';
import { PromoModule } from './promo/promo.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [UsersModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST as string,
      port: parseInt(process.env.DB_PORT as string),
      username: process.env.DB_USER,
      password: process.env.DB_PASS ,
      database: process.env.DB_NAME,
      autoLoadEntities: true, // Automatically load entities (recommended for development)
      synchronize: true, // Sync database schema (disable in production)
    }),
    AuthModule,
    ElasticModule,
    RedisModule,
    RabbitmqModule,
    EventsModule,
    ProductsModule,
    RatingModule,
    CloudinaryModule,
    CategoriesModule,
    PromoModule,
    PaymentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

import { Module, Global } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { RabbitMQExceptionFilter } from 'src/rabbitmq-exceptions.filter';
import { AuthModule } from 'src/auth/auth.module';
import { EventsModule } from 'src/events/events.module';
import { ProductsModule } from 'src/products/products.module';
import { RatingModule } from 'src/rating/rating.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { PromoModule } from 'src/promo/promo.module';
import { PaymentsModule } from 'src/payments/payments.module';

@Global()
@Module({
  imports: [
    UsersModule,
    AuthModule,
    ProductsModule,
    RatingModule,
    CategoriesModule,
    PromoModule,
    PaymentsModule,
    EventsModule,
    ConfigModule.forRoot(),
  ],
  providers: [RabbitmqService, RabbitMQExceptionFilter],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { connect, AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { AuthService } from 'src/auth/auth.service';
import { RabbitMQExceptionFilter } from 'src/rabbitmq-exceptions.filter';
import { EventsGateway } from 'src/events/events.gateway';
import { ProductsService } from 'src/products/products.service';
import { RatingService } from 'src/rating/rating.service';
import { CategoriesService } from 'src/categories/categories.service';
import { PromoService } from 'src/promo/promo.service';
import { PaymentsService } from 'src/payments/payments.service';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private amqpConnection: AmqpConnectionManager;
  private amqpChannel: ChannelWrapper;

  // Define queues and their corresponding handlers
  private queues = {
    users: [
      {
        createUsers: async (createUserDto: any) => {
          return await this.usersService.create(createUserDto); // Ensure this returns a Promise
        },
      },
      {
        editUsers: async (updateUserDto: any) => {
          const { id, ...updateData } = updateUserDto;
          if (!id) {
            throw new Error("Missing 'id' field in updateUserDto");
          }
          return await this.usersService.update(id, updateData);
        },
      },
      {
        deleteUsers: async (data: any) => {
          const { id } = data;
          return await this.usersService.remove(+id);
        },
      },
      {
        addToCart: async (data: any) => {
          const { jwt, userId, productId } = data;
          return await this.usersService.addCart(jwt, userId, productId);
        }
      },
      {
        removeFromCart: async (data: any) => {
          const { jwt, userId, productId } = data;
          return await this.usersService.removeCart(jwt, userId, productId);
        }
      },
    ],
    auth: [
      {
        authLogin: async (data: any) => {
          return await this.authService.login(data.login, data.password);
        },
      },
      {
        authRegister: async (createUserDto: any) => {
          return await this.authService.register(createUserDto);
        },
      },
    ],
    products: [
      {
        productsCreate: async (createProductDto: any) => {
          return await this.productsService.create(createProductDto);
        },
      },
      {
        productsEdit: async (updateProductDto: any) => {
          const { jwt, id, ...updateData } = updateProductDto;
          return await this.productsService.update(jwt, id, updateData);
        }
      },
      {
        productsDelete: async (data: any) => {
          const { jwt, id } = data;
          return await this.productsService.remove(jwt, id);
        }
      }
    ],
    ratings: [
      {
        ratingsCreate: async (createRatingDto: any) => {
          return await this.ratingService.addRating(createRatingDto);
        },
      },
      {
        ratingsDelete: async (data: any) => {
          return await this.ratingService.deleteRating(data.id);
        },
      }
    ],
    categories: [
      {
        categoriesCreate: async (createCategoryDto: any) => {
          return await this.categoriesService.create(createCategoryDto);
        },
      },
      {
        categoriesDelete: async (data: any) => {
          const { id } = data;
          return await this.categoriesService.remove(id);
        }
      }
    ],
    promos: [
      {
        promosCreate: async (createPromoDto: any) => {
          return await this.promoService.createPromoCode(createPromoDto);
        }
      },
      {
        promosDelete: async (data: any) => {
          const { name } = data;
          return await this.promoService.deletePromoCode(name);
        }
      },
      {
        promosCheck: async (data: any) => {
          const { name } = data;
          return await this.promoService.checkPromoCode(name);
        }
      }
    ],
    payments: [
      {
        paymentsStatusUpdateSender: async (data: any) => {
          const { jwt, id, status } = data;
          return await this.paymentsService.updateCartStatusSender(jwt, +id, status);
        }
      },
      {
        paymentsStatusUpdateReceiver: async (data: any) => {
          const { jwt, id, status } = data;
          return await this.paymentsService.updateCartStatusReceiver(jwt, +id, status);
        }
      },
      {
        paymentsConfirm: async (data: any) => {
          const { paymentIntentId, paymentMethodId, customerDetails } = data;
          return await this.paymentsService.confirmPayment(paymentIntentId, paymentMethodId, customerDetails);
        }
      }
    ],
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly productsService: ProductsService,
    private readonly ratingService: RatingService,
    private readonly categoriesService: CategoriesService,
    private readonly promoService: PromoService,
    private readonly paymentsService: PaymentsService,
    private readonly rabbitMQExceptionFilter: RabbitMQExceptionFilter,
    private readonly eventsGateway: EventsGateway,
  ) {
    const rabbitMqUrl = this.configService.get<string>('RABBITMQ_HOST') as string;

    // Initialize RabbitMQ connection
    this.amqpConnection = connect([rabbitMqUrl]);

    this.amqpConnection.on('connect', () => console.log('✅ Connected to RabbitMQ'));
    this.amqpConnection.on('disconnect', (err) => console.error('❌ Disconnected from RabbitMQ', err));

    this.amqpChannel = this.amqpConnection.createChannel({
      json: true,
      setup: async (channel: ConfirmChannel) => {
        // Ensure the queue and exchange exist
        for (const exchange of Object.keys(this.queues)) {
          await channel.assertExchange(exchange, 'direct', { durable: true });

          for (const queueObj of this.queues[exchange]) {
            const queueName = Object.keys(queueObj)[0]; // Get queue name
            await channel.assertQueue(queueName, { durable: true });
            await channel.bindQueue(queueName, exchange, queueName); // Bind queue to exchange
            console.log(`📥 Queue ${queueName} is ready.`);
          }
        }
      },
    });
  }

  async onModuleInit() {
    console.log('🔄 RabbitMQ Consumer is starting...');

    try {
      for (const exchange of Object.keys(this.queues)) {
        for (const queueObj of this.queues[exchange]) {
          const queueName = Object.keys(queueObj)[0]; // Extract queue name
          const callback = queueObj[queueName]; // Extract callback function

          await this.consume(queueName, async (message: any) => {
            const { notifications_token, ...payload } = message; 
            try {
              let callbackres = await callback(payload); 
              console.log('✅ Successfully processed message:', callbackres);

              // Forward the message to WebSocket clients
              if (notifications_token) {
                this.eventsGateway.sendToUser(notifications_token, queueName, callbackres);
              }
            } catch (error) {
              // Use the custom exception filter to handle errors
              let exception = this.rabbitMQExceptionFilter.catch(error);
              if (notifications_token) {
                this.eventsGateway.sendToUser(notifications_token, queueName, exception);
              }
            }
          });
        }
      }

      console.log('✅ RabbitMQ Consumer started successfully.');
    } catch (error) {
      console.error('❌ Error starting RabbitMQ Consumer:', error);
    }
  }

  // Publish a message to a queue
  async publish(queue: string, message: any): Promise<void> {
    try {
      const msg = Buffer.from(JSON.stringify(message)).toString();

      await this.amqpChannel.sendToQueue(queue, msg);
    } catch (error) {
      console.error('❌ Error publishing message:', error);
    }
  }

  // Automatically consume messages on startup
  async consume(queue: string, callback: (message: any) => void): Promise<void> {
    try {
      await this.amqpChannel.consume(queue, (msg) => {
        if (msg) {
          try {
            console.log('📨 Message received in queue:', queue)
            const message = JSON.parse(JSON.parse(msg.content.toString()));
            callback(message); // Handle the message
          } catch (error) {
            console.error('❌ Error parsing message:', error);
          } finally {
            this.amqpChannel.ack(msg); // Acknowledge the message
          }
        }
      });
  
      console.log(`🎧 Started consuming messages from ${queue}`);
    } catch (error) {
      console.error(`❌ Error consuming message from ${queue}:`, error);
    }
  }

  // Graceful shutdown
  async onModuleDestroy() {
    await this.amqpConnection.close();
    console.log('⚠️ RabbitMQ connection closed.');
  }
}
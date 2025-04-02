import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { ConfirmPaymentDto, UserCartDto } from './entity/payments.entity';
import { PaymentsService } from './payments.service';
import { Controller, Post, Body, ValidationPipe, Patch, Param, UseGuards, Get, Headers, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwtauth/jwtauth.guard';
import { RedisService } from 'src/redis/redis.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly redisService: RedisService,
  ) {}
  
  
  @Get()
  async getPayments(@Headers('authorization') auth: string, @Query('userId') userId: string): Promise<any> {
    return await this.paymentsService.getCarts(auth, +userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('private')
  async getPrivatePayments(@Headers('authorization') auth: string, @Query('userId') userId: string): Promise<any> {
    return await this.paymentsService.getPrivateCarts(auth, +userId);
  }

  @Get('ordersData/:id')
  async getOrdersData(@Param('id') userId: string): Promise<any> {
    return await this.paymentsService.getSuccessAndFailedOrders(+userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-intent')
  async createPaymentIntent(@Body(ValidationPipe) body: UserCartDto): Promise<any> {
    const payment = await this.paymentsService.createCart(body);

    const { total } = payment;
    const paymentIntent = await this.paymentsService.createPaymentIntent(total);
    
    await this.redisService.setex(`uncompletedPaymentIntent${paymentIntent.id}`, 600, payment);
    return { paymentId: paymentIntent.id, payment };
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm-payment')
  async confirmPayment(@Body(new ValidationPipe({ transform: true })) body: ConfirmPaymentDto): Promise<any> {
    return await this.rabbitmqService.publish('paymentsConfirm', body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/sender/:id')
  async updatePaymentStatusSender(@Headers('authorization') auth: string, @Param('id') id: string, @Body() data: any): Promise<any> {
    return await this.rabbitmqService.publish('paymentsStatusUpdateSender', {jwt: auth, id, ...data});
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/receiver/:id')
  async updatePaymentStatusReceiver(@Headers('authorization') auth: string, @Param('id') id: string, @Body() data: any): Promise<any> {
    return await this.rabbitmqService.publish('paymentsStatusUpdateReceiver', {jwt: auth, id, ...data});
  }
}
import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { PromoService } from './promo.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { JwtAdminGuard } from 'src/auth/jwtauth/jwtauth.guard';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';

@Controller('promo')
export class PromoController {
  constructor(
    private readonly promoService: PromoService,
    private readonly rabbitmqService: RabbitmqService
  ) {}

  @UseGuards(JwtAdminGuard)
  @Get()
  async getAllPromoCodes(): Promise<any[]> {
    return this.promoService.getAllPromoCodes();
  }

  @UseGuards(JwtAdminGuard)
  @Get(':name')
  async getPromoCodeById(@Param('name') name: string): Promise<any | null> {
    return this.promoService.getPromoCodeByName(name);
  }

  @Post('check/:name')
  async checkPromocode(@Param('name') name: string, @Body() data: any): Promise<any> {
    return this.rabbitmqService.publish('promosCheck', {name, ...data})
  }

  @UseGuards(JwtAdminGuard)
  @Post()
  async createPromoCode(@Body() createPromoDto: CreatePromoDto): Promise<any> {
    return this.rabbitmqService.publish('promosCreate', createPromoDto);
  }

  @UseGuards(JwtAdminGuard)
  @Post(':name')
  async removePromoCode(@Param('name') name: string, @Body() data: any): Promise<any> {
    return this.rabbitmqService.publish('promosDelete', {name, ...data})
  }
}

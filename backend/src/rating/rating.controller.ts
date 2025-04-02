import { Controller, Get, Param, Post, ValidationPipe, Body, UseGuards } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { JwtAdminGuard, JwtAuthGuard } from 'src/auth/jwtauth/jwtauth.guard';

@Controller('ratings')
export class RatingController {
  constructor(
    private readonly ratingService: RatingService,
    private readonly rabbitmqService: RabbitmqService
  ) {}

  @UseGuards(JwtAdminGuard)
  @Get()
  async findAll(): Promise<any> {
    return await this.ratingService.findAll();
  }

  @Get(':productId')
  async getRatings(@Param('productId') productId: string): Promise<any> {
    return await this.ratingService.getRatings(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async addRating(@Body(ValidationPipe) createRating: CreateRatingDto): Promise<any> {
    return await this.rabbitmqService.publish('ratingsCreate', createRating);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id')
  async deleteRating(@Param('id') id: string, @Body() data: any): Promise<any> {
    return await this.rabbitmqService.publish('ratingsDelete', {id, ...data});
  }
}

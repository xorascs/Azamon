import { Controller, Get, Post, Body, Patch, Param, UseInterceptors, ValidationPipe, Headers, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { UploadedFile } from '@nestjs/common';
import { SearchData } from 'src/elastic/elastic.service';
import { EventsGateway } from 'src/events/events.gateway';
import { JwtAuthGuard } from 'src/auth/jwtauth/jwtauth.guard';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body(ValidationPipe) createProductDto: CreateProductDto) {
    return await this.rabbitmqService.publish('productsCreate', createProductDto);
  }

  @Get()
  async findAll() {
    return await this.productsService.findAll();
  }

  @Post('/search')
  async search(@Body() searchData?: SearchData) {
    return await this.productsService.findAll(searchData);
  }

  @Get('/hot')
  async getAllHotProducts() {
    return await this.productsService.getAllHotProducts();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Headers('authorization') JWT?: string | undefined) {
    return await this.productsService.findOne(id, JWT);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Headers('authorization') auth: string, @Param('id') id: string, @Body(ValidationPipe) updateProductDto: UpdateProductDto) {
    return await this.rabbitmqService.publish('productsEdit', {jwt: auth, id, ...updateProductDto});
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id')
  async remove(@Headers('authorization') auth: string, @Param('id') id: string, @Body() data: any) {
    return await this.rabbitmqService.publish('productsDelete', {jwt: auth, id, ...data});
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateAvatar(@Headers('authorization') auth: string, @Param('id') id: string, @Body() data: any, @UploadedFile() file: Express.Multer.File) {
    const action = await this.productsService.updateAvatar(auth, id, file);
    this.eventsGateway.sendToUser(data.notifications_token, 'updateAvatarProducts', action);
    return action;
  }
}

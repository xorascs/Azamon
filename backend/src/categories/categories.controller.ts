import { Body, Controller, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAdminGuard } from 'src/auth/jwtauth/jwtauth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventsGateway } from 'src/events/events.gateway';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Get()
  async findAll(): Promise<any> {
    return await this.categoriesService.findAll();
  }

  @UseGuards(JwtAdminGuard)
  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return await this.rabbitmqService.publish('categoriesCreate', createCategoryDto);
  }

  @UseGuards(JwtAdminGuard)
  @Post(':id')
  async remove(@Param('id') id: string, @Body() data: any) {
    const intid = +id;
    return await this.rabbitmqService.publish('categoriesDelete', {id: intid, ...data});
  }

  @UseGuards(JwtAdminGuard)
  @Patch(':id/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateAvatar(@Param('id') id: string, @Body() data: any, @UploadedFile() file: Express.Multer.File) {
    const action = await this.categoriesService.updateAvatar(+id, file);
    this.eventsGateway.sendToUser(data.notifications_token, 'updateAvatarCategories', action);
    return action;
  }
}

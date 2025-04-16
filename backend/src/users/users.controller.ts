import { Controller, Get, Post, Body, Patch, Param, UseInterceptors, Query, ValidationPipe, UseGuards, Headers, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAdminGuard, JwtAuthGuard } from 'src/auth/jwtauth/jwtauth.guard';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile } from '@nestjs/common';
import { EventsGateway } from 'src/events/events.gateway';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly eventsGateway: EventsGateway
  ) {}

  @UseGuards(JwtAdminGuard)
  @Post()
  async create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return await this.rabbitmqService.publish('createUsers', createUserDto);
  }

  @UseGuards(JwtAdminGuard)
  @Get() // Handles GET /users
  async findAll(@Query('email') email?: string) {
    if (email) {
      return await this.usersService.findByEmail(email);
    }
    return await this.usersService.findAll();
  }

  @Get('/userItems')
  async findItems(@Headers('authorization') auth: string, @Query('userId') userId: string, @Query('items') items: 'products' | 'cart') {
    return await this.usersService.getUserItems(auth, +userId, items);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.usersService.findOne(+id, true);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/addToCart')
  async addToCart(@Headers('authorization') authorizationHeader: string, @Body() data: any) {
    return await this.rabbitmqService.publish('addToCart', {jwt: authorizationHeader, ...data});
  }

  @UseGuards(JwtAuthGuard)
  @Post('/removeFromCart')
  async removeFromCart(@Headers('authorization') authorizationHeader: string, @Body() data: any) {
    return await this.rabbitmqService.publish('removeFromCart', {jwt: authorizationHeader, ...data});
  }

  @Get(':id/avatar')
  async findAvatar(@Param('id') id: string) {
    return await this.usersService.getAvatar(+id);
  }

  @UseGuards(JwtAdminGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body(ValidationPipe) updateUserDto: UpdateUserDto) {
    return await this.rabbitmqService.publish('editUsers', {id, ...updateUserDto});
  }

  @UseGuards(JwtAdminGuard)
  @Post(':id')
  async remove(@Param('id') id: string, @Body() data: any) {
    return await this.rabbitmqService.publish('deleteUsers', {id, ...data});
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateAvatar(@Headers('authorization') authorizationHeader: string, @Param('id') id: string, @Body() data: any, @UploadedFile() file: Express.Multer.File) {
    const action = await this.usersService.updateAvatar(authorizationHeader, +id, file);
    this.eventsGateway.sendToUser(data.notifications_token, 'updateAvatarUsers', action);
    return action;
  }
}
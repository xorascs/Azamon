import { Controller, Post, Body, ValidationPipe, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  // Register route
  @Post('register')
  async register(@Body(ValidationPipe) createUserDto: RegisterUserDto) {
    return await this.rabbitmqService.publish('authRegister', createUserDto);
  }

  // Login route
  @Post('login')
  async login(@Body(ValidationPipe) user: LoginUserDto) {
    return await this.rabbitmqService.publish('authLogin', user);
  }

  @Post('refresh-access-token')
  async refreshToken(@Headers('x-authorization') authorizationHeader: string): Promise<{ status: string, accessToken?: string }> {
    const refreshToken = authorizationHeader;
    if (!refreshToken) {
      return { "status": "fail" }
    }

    return await this.authService.refreshAccessToken(refreshToken);
  }
}

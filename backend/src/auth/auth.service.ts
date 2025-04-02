import { Injectable, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto, Roles } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { CustomResponse } from 'config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // Register a new user
  async register(createUserDto: CreateUserDto): Promise<CustomResponse> {
    // Create the user
    await this.usersService.create({
      ...createUserDto,
      role: Roles.USER,
    });

    return { "status": "success", "response": "Successfully registered!" }
  }

  // Login a user and generate a JWT token
  async login(login: string, password: string): Promise<{ status: string, response: string, userLogin?: string, accessToken?: string, refreshToken?: string }> {
    const user = await this.usersService.findByLogin(login);
    if (!user) {
      return { status: "fail", response: "This user does not exist" };
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { status: "fail", response: "Incorrect login or password" };
    }

    // Generate a JWT token
    const accessTokenPayload = { role: user.role, sub: user.id };
    const refreshTokenPayload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(accessTokenPayload);
    const refreshToken = this.jwtService.sign(refreshTokenPayload, { expiresIn: '7d' });
    const hashedrefreshToken = await bcrypt.hash(this.jwtService.sign(refreshTokenPayload), 10);

    this.usersService.updateRefreshToken(user.id, hashedrefreshToken);

    return { "status": "success", "response": "Successfully log in!", "userLogin": user.login, "accessToken": accessToken, "refreshToken": refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ status: string, accessToken?: string }> {
    // Remove the "Bearer " prefix from the refresh token
    const token = refreshToken.replace('Bearer ', '');
  
    // Verify the refresh token
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token); // Verify the token
    } catch (error) {
      return { "status": "fail" }
    }
  
    // Find the user associated with the refresh token
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      return { "status": "fail" }
    }
  
    // Compare the provided refresh token with the one stored in the database
    const isTokensCompare = await bcrypt.compare(token, user.refreshToken);
    if (!isTokensCompare) {
      return { "status": "fail" }
    }
  
    // Issue a new access token
    const accessToken = this.jwtService.sign({ role: user.role, sub: user.id });
  
    return { "status": "success", accessToken };
  }
}
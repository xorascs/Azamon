import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entity/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Ensure the token expiration is respected
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: any): Promise<User> {
    if (!payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
    }

    // Check if the token has expired
    const currentTimestamp = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds
    if (payload.exp && payload.exp < currentTimestamp) {
        throw new UnauthorizedException('Token has expired');
    }

    // Find the user based on the token payload
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
        throw new UnauthorizedException('User not found');
    }

    return user;
  }
}

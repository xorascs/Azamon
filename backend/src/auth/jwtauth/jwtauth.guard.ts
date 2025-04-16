import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/users/dto/create-user.dto';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtAdminGuard extends JwtAuthGuard {
  constructor() {
    super();
  }

  // Override the handleRequest method to add logic for Admins
  handleRequest(err: any, user: any) {
    if (err || !user || user.role !== Roles.ADMIN) {
      const exception = err || new Error('Forbidden: Admin role required');

      throw exception; // Throw the error to propagate it
    }

    return user;
  }
}
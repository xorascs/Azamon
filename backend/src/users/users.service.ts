import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { CreateUserDto, Roles } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { ProductsService } from 'src/products/products.service';
import { RedisService } from 'src/redis/redis.service';
import { CustomResponse } from 'config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
  ) {}

  getSafeData(user: User): any {
    return {
      id: user.id,
      avatar: user.avatar,
      login: user.login,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      cart: user.cart !== null ? user.cart.length : 0,
      products: user.products !== null ? user.products.length : 0,
    }
  }

  // Custom method to save user and update Redis if necessary
  async saveUserWithRedis(user: User): Promise<User> {
    const timeForUser = 60000;

    const savedUser = await this.userRepository.save(user);

    const redisUserKey = `user:${savedUser.id}`;
    const cachedUser = await this.redisService.get(redisUserKey);

    if (cachedUser) {
      await this.redisService.setex(redisUserKey, timeForUser, JSON.stringify(savedUser));
    }

    return savedUser;
  }

  async getUserFromJWT(jwt: string): Promise<User | null> {
    const token = jwt.replace('Bearer ', '');
  
    // Verify the refresh token
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token); // Verify the token
    } catch (error) {
      return null;
    }

    return await this.findOne(payload.sub);
  }

  // Create a new user
  async create(createUserDto: CreateUserDto): Promise<CustomResponse> {
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create(createUserDto);
    await this.saveUserWithRedis(user);
    return { response: "User successfully created!", status: "success" };
  }

  // Find all users, optionally filtered by role
  async findAll(role?: Roles): Promise<User[]> {
    if (role) {
      // If role is provided, find users with the given role
      return await this.userRepository.find({ where: { role } });
    }
    // Otherwise, return all users
    return await this.userRepository.find();
  }

  // Finds a user by their email
  async findByEmail(email: string, isError: boolean = true): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      if (isError) {
        // If isError is true, throw an error if the user is not found
        throw new NotFoundException(`User with email ${email} not found`);
      }
      return null;
    }
    return user;
  }

  // Finds a user by their login
  async findByLogin(login: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { login } });
    if (!user) {
      return null;
    }
    return user;
  }

  // Find a user by their ID
  async findOne(id: number, safe: boolean = false): Promise<User | null> {
    const redisUserKey = `user:${id}`;
    const redisUserPopKey = `userPop:${id}`;
    const timeForUser = 60000;

    // Step 1: Check if the user data is already cached in Redis
    const cachedUser = await this.redisService.get(redisUserKey);
    if (cachedUser) {
      return safe ? this.getSafeData(JSON.parse(cachedUser)) : JSON.parse(cachedUser); // Parse the cached JSON data
    }

    // Step 2: Check or initialize the userPop counter in Redis
    let userPopCount = await this.redisService.get(redisUserPopKey);
    if (!userPopCount) {
      // Initialize the userPop counter with TTL of 10 seconds
      await this.redisService.setex(redisUserPopKey, 10, '1');
      userPopCount = '1';
    } else {
      // Increment the userPop counter
      userPopCount = (await this.redisService.incr(redisUserPopKey)).toString();
    }

    // Step 3: If the userPop count reaches 5, cache the user data in Redis
    if (parseInt(userPopCount, 10) >= 5) {
      console.log(`UserPop count reached 5 for userId ${id}. Caching user data in Redis.`);

      // Fetch the user from the database
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Cache the user data in Redis with no expiration (or set a custom TTL if needed)
      await this.redisService.setex(redisUserKey, timeForUser, JSON.stringify(user));

      // Clear the userPop counter
      await this.redisService.del(redisUserPopKey);

      return safe ? this.getSafeData(user) : user;
    }

    // Step 4: If the userPop count is less than 5, fetch the user from the database
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return safe ? this.getSafeData(user) : user;
  }

  async getAvatar(id: number): Promise<any> {
    const user = await this.findOne(id);
    if (!user) return { response: "User not found!", status: "fail" };
    return user.avatar ? user.avatar : null;
  }

  // Update an existing user
  async update(id: number, updateUserDto: UpdateUserDto): Promise<CustomResponse> {
    const user = await this.findOne(id); // Ensure the user exists before updating
    if (updateUserDto.password != null) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update the user with the provided data
    const updatedUser = Object.assign(user!, updateUserDto);

    await this.saveUserWithRedis(updatedUser);
    return { response: "User successfully updated!", status: "success" };
  }

  async getUserItems(jwt: string, userId: number, items: 'products' | 'cart'): Promise<any> {
    const user = await this.findOne(userId);
    if (!user) return { response: "User not found!", status: "fail" };

    if (items === 'cart') {
      const owner = await this.getUserFromJWT(jwt);
      if (!user || !owner) return { response: "User not found or JWT expired!", status: "fail" };

      if (owner.role !== Roles.ADMIN && owner.id !== user.id) return { response: "You can not get items from this user!", status: "fail" };
    }
  
    // Ensure the items array exists and is not empty
    const userItems = user[items] || [];
    if (userItems.length === 0) return null;
  
    const gotItems: any[] = [];
    const validItemIds: string[] = [];
  
    for (const itemId of userItems) {
      const item = await this.productsService.findOne(itemId);
  
      if (item) {
        gotItems.push(item);
        validItemIds.push(itemId);
      }
    }
  
    if (validItemIds.length !== userItems.length) {
      user[items] = validItemIds;
      await this.saveUserWithRedis(user);
    }
  
    return gotItems;
  }

  // Add a product to the user's products array
  async addProduct(userId: number, productId: string): Promise<CustomResponse> {
    const user = await this.findOne(userId);
    if (!user) {
      return { response: "User not found!", status: "fail" };
    }

    // Ensure the products array exists
    if (!user.products) {
      user.products = [];
    }

    // Add the product ID if it's not already in the array
    if (!user.products.includes(productId)) {
      user.products.push(productId);
    }

    // Save the updated user
    await this.saveUserWithRedis(user);

    return { response: "Product successfully added to user's products!", status: "success" };
  }

  // Remove a product from the user's products array
  async removeProduct(userId: number, productId: string): Promise<CustomResponse> {
    const user = await this.findOne(userId);
    if (!user) {
      return { response: "User not found!", status: "fail" };
    }

    // Ensure the products array exists
    if (!user.products || !Array.isArray(user.products)) {
      user.products = [];
    }

    // Find the index of the product ID in the array
    const productIndex = user.products.indexOf(productId);

    // If the product ID exists, remove it
    if (productIndex !== -1) {
      user.products.splice(productIndex, 1);
    } else {
      return { response: "Product not found in user's products!", status: "fail" };
    }

    // Save the updated user
    await this.saveUserWithRedis(user);

    return { response: "Product successfully removed from user's products!", status: "success" };
  }

  // Add an item to the user's cart array
  async addCart(jwt: string, userId: number, itemId: string): Promise<CustomResponse> {
    const owner = await this.getUserFromJWT(jwt);
    const user = await this.findOne(userId);
    const product = await this.productsService.findOne(itemId);
    if (!user || !owner) return { response: "User not found or JWT expired!", status: "fail" };

    if (owner.role !== Roles.ADMIN && owner.id !== user.id) return { response: "You can not change this user!", status: "fail" };
    if (product._source.userId === owner.id) return { response: "You can not add to cart your own product!", status: "fail" };

    if (!user.cart) {
      user.cart = [];
    }

    if (!user.cart.includes(itemId)) {
      user.cart.push(itemId);
    }
    else {
      return { response: "This item is already in your cart!", status: "fail" };
    }

    await this.saveUserWithRedis(user);

    return { response: "Item successfully added to your cart!", status: "success" };
  }

  // Remove an item from the user's cart array
  async removeCart(jwt: string, userId: number, itemId: string): Promise<CustomResponse> {
    const owner = await this.getUserFromJWT(jwt);
    const user = await this.findOne(userId);
    if (!user || !owner) return { response: "User not found or JWT expired!", status: "fail" };

    if (owner.role !== Roles.ADMIN && owner.id !== user.id) return { response: "You can not change this user!", status: "fail" };

    // Ensure the cart array exists
    if (!user.cart || !Array.isArray(user.cart)) {
      user.cart = [];
    }

    // Find the index of the item ID in the array
    const itemIndex = user.cart.indexOf(itemId);

    // If the item ID exists, remove it
    if (itemIndex !== -1) {
      user.cart.splice(itemIndex, 1);
    } else {
      return { response: "Item not found in user's cart!", status: "fail" };
    }

    // Save the updated user
    await this.saveUserWithRedis(user);

    return { response: "Item successfully removed from user's cart!", status: "success" };
  }

  // Update an existing user
  async updateRefreshToken(id: number, refreshToken: string): Promise<User> {
    const user = await this.findOne(id); // Ensure the user exists before updating

    // Update the user's refreshToken
    user!.refreshToken = refreshToken;

    // Save the updated user to the database
    return await this.saveUserWithRedis(user!);
  }

  // Delete a user by their ID
  async remove(id: number): Promise<CustomResponse> {
    const user = await this.findOne(id); // Ensure the user exists before removing
    await this.deleteUserAvatar(user!);
    await this.userRepository.remove(user!);
    return { response: "User successfully deleted!", status: "success" };
  }

  async updateAvatar(jwt: string, id: number, file: Express.Multer.File): Promise<{ status: string; response: string; avatarUrl?: string }> {
    const owner = await this.getUserFromJWT(jwt);
    const user = await this.findOne(id);
    if (!user || !owner) return { response: "User not found or JWT expired!", status: "fail" };

    if (owner.role !== Roles.ADMIN && owner.id !== user.id) return { response: "You can not change avatar for this user!", status: "fail" };

    await this.deleteUserAvatar(user);

    // Upload the new avatar image to Cloudinary
    const avatarUrl = await this.cloudinaryService.uploadImage(file);

    // Update the user's avatar in the database
    user.avatar = avatarUrl;
    await this.saveUserWithRedis(user);

    return { status: 'success', response: 'User avatar successfully updated!', avatarUrl };
  }

  async deleteUserAvatar(user: User): Promise<any> {
    // Check if the user already has an avatar and delete it if exists
    if (user.avatar) {
      // Extract the public ID of the old avatar image from the URL (assuming Cloudinary format)
      const publicId = user.avatar.split('/').slice(-2).join('/').split('.').slice(0, -1).join('.');

      if (publicId) {
        try {
          // Delete the previous avatar from Cloudinary
          const deleteResult = await this.cloudinaryService.deleteImage(publicId);
          if (!deleteResult) {
            console.error('Failed to delete old avatar from Cloudinary');
          }
        } catch (error) {
          console.error('Error while deleting old avatar', error);
        }
      }
    }
  }
}

import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RatingService } from 'src/rating/rating.service';
import { ElasticService } from 'src/elastic/elastic.service';
import { SearchData } from 'src/elastic/elastic.service';
import { RedisService } from 'src/redis/redis.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { Roles } from 'src/users/dto/create-user.dto';
import { CustomResponse } from 'config';
import { CategoriesService } from 'src/categories/categories.service';
import { generateRandomId } from 'config';

const indexName = 'products';
const countToHot = 10
const timeToHot = 60
const timeFromHot = 60000

@Injectable()
export class ProductsService {
  constructor(
    @Inject(forwardRef(() => RatingService)) // Use forwardRef for circular dependency
    private readonly ratingService: RatingService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => CategoriesService))
    private readonly categoriesService: CategoriesService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly elasticService: ElasticService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {
    if (!this.elasticService.indexExists(indexName).then((exists) =>!exists)) {
      this.elasticService.createIndex(indexName);
    }
  }

  async create(createProductDto: CreateProductDto): Promise<CustomResponse> {
    // Validate the product price
    if (createProductDto.price > 5000 || createProductDto.price < 0.01) return { status: "fail", response: "Product price max is 5000 and min is 0.01!" };
    if (!(await this.categoriesService.isCategoryExists(createProductDto.category))) return { status: "fail", response: "Category does not exist!" };
  
    let rndId = generateRandomId();
    let isIdUnique = false;
  
    while (!isIdUnique) {
      const existingProduct = await this.findOne(rndId);
      if (!existingProduct) {
        isIdUnique = true;
      }
      else {
        rndId = generateRandomId();
      }
    }
  
    // Set default rating
    createProductDto.rating = 0;
    createProductDto.ratingQuantity = 0;
  
    // Add the product data to Elasticsearch
    await this.elasticService.addData(indexName, rndId, createProductDto);
  
    // Add the product ID to the user's products array
    await this.usersService.addProduct(+createProductDto.userId, rndId);

    await this.categoriesService.changeProductsCount(createProductDto.category, 'add');
  
    return { status: "success", response: "Product created successfully!" };
  }

  findAll(searchData?: SearchData) {
    const data: SearchData = searchData ? 
    { 
      ...searchData, 
      index: searchData.index || indexName,  // Ensure the index is set if missing
      field: searchData.field || "",         // Default empty string if no field
      searchType: searchData.searchType || 'all'  // Default 'match' for searchType
    }
  : { 
      index: indexName, 
      field: "", 
      searchType: "all"
    };
    return this.elasticService.searchData(data);
  }

  async findOne(id: string, JWT?: string | undefined) {
    // Check if the product is already in hotProducts
    const redisProduct = await this.redisService.get(`hotProducts:${id}`);
    if (redisProduct) {
      return JSON.parse(redisProduct);
    }

    if (JWT !== undefined) {
      try {
        JWT = JWT.replace('Bearer ', '');
        await this.jwtService.verifyAsync(JWT);
      } catch (error) {
        throw new UnauthorizedException(error);
      }

      const productPopData = await this.redisService.get(`productsPop:${id}`);
      const parsed = productPopData ? JSON.parse(productPopData as string) : { count: 0, users: "" };
      let count = parsed.count ? parseInt(parsed.count, 10) : 0;
      let users = parsed.users ? new Set(parsed.users.split(',')) : new Set();

      if (!users.has(JWT.toString())) {
        users.add(JWT.toString());
        count++;

        if (count >= countToHot) {
            const actualValue = await this.elasticService.getData(indexName, id);
            await this.redisService.del(`productsPop:${id}`);

            // Save as hot product with TTL
            await this.redisService.setex(`hotProducts:${id}`, timeFromHot, JSON.stringify(actualValue));

            // Add the key to the set
            await this.redisService.sadd('hotProductsSet', `hotProducts:${id}`);

            return actualValue;
        }

        await this.redisService.setex(`productsPop:${id}`, timeToHot, {
            count: count.toString(),
            users: Array.from(users).join(","),
        });
      }
    }

    return this.elasticService.getData(indexName, id);
  }

  async getAllHotProducts() {
    // Get all keys from the set
    const hotProductKeys = await this.redisService.smembers('hotProductsSet');

    // Retrieve data for each key
    const hotProducts = await Promise.all(
        hotProductKeys.map(async (key) => {
            const data = await this.redisService.get(key);
            if (data === null) {
              this.redisService.srem('hotProductsSet', key);
            }
            return JSON.parse(data as string);
        })
    );

    return hotProducts;
  }

  async update(jwt: string, id: string, updateProductDto: UpdateProductDto, withJWT: boolean = true): Promise<CustomResponse> {
    const product = await this.findOne(id);
    if (withJWT) {
      const owner = await this.usersService.getUserFromJWT(jwt);
      const user = await this.usersService.findOne(product._source.userId);
      if (!user || !owner) return { response: "User not found or JWT expired!", status: "fail" };

      if (owner.role !== Roles.ADMIN && owner.id !== user.id) return { response: "You can not change this product!", status: "fail" };
    }

    if (updateProductDto.price !== undefined && updateProductDto.price > 5000) return { status: "fail", response: "Product price maximum is 5000!" };
    if (
      updateProductDto.category !== undefined && 
      !(await this.categoriesService.isCategoryExists(updateProductDto.category))
    ) return { status: "fail", response: "Category does not exist!" };

    if (updateProductDto.category !== undefined) {
      await this.categoriesService.changeProductsCount(product._source.category, 'del');
      await this.categoriesService.changeProductsCount(updateProductDto.category, 'add');
    }

    const redisValue = await this.redisService.get(`hotProducts:${id}`);

    // Perform the update in Elasticsearch first
    await this.elasticService.updatePartial(indexName, id, updateProductDto);

    if (redisValue !== null) {
        // Fetch the latest data from Elasticsearch
        const updatedProduct = await this.elasticService.getData(indexName, id);

        // Update Redis cache with the new product data
        await this.redisService.setex(`hotProducts:${id}`, timeFromHot, JSON.stringify(updatedProduct));
        
        // Ensure the key remains in the hotProducts set
        await this.redisService.sadd('hotProductsSet', `hotProducts:${id}`);
    }
    
    return { status: "success", response: 'Product updated successfully' };
  }

  async remove(jwt: string, id: string, withJWT: boolean = true): Promise<CustomResponse> {
    const product = await this.findOne(id);
    if (withJWT) {
      const owner = await this.usersService.getUserFromJWT(jwt);
      const user = await this.usersService.findOne(product._source.userId);
      if (!user || !owner) return { response: "User not found or JWT expired!", status: "fail" };

      if (owner.role !== Roles.ADMIN && owner.id !== user.id) return { response: "You can not change this product!", status: "fail" };
    }

    await this.deleteAvatar(id);
    await this.ratingService.deleteRatings(id);
    
    const redisValue = this.redisService.get(`hotProducts:${id}`);
    if (redisValue !== undefined) {
        await this.redisService.del(`hotProducts:${id}`);
        await this.redisService.srem('hotProductsSet', `hotProducts:${id}`);
    }
    await this.usersService.removeProduct(product._source.userId, product._id);
    await this.elasticService.delete(indexName, id);

    await this.categoriesService.changeProductsCount(product._source.category, 'del');

    return { status: "success", response: 'Product deleted successfully' };
  }

  async updateAvatar(jwt: string, id: string, file: Express.Multer.File): Promise<{ status: string; response: string; avatarUrl?: string }> {
    const owner = await this.usersService.getUserFromJWT(jwt);
    const product = await this.findOne(id);
    const user = await this.usersService.findOne(product._source.userId);
    if (!user || !owner) return { response: "User not found or JWT expired!", status: "fail" };

    if (owner.role !== Roles.ADMIN && owner.id !== user.id) return { response: "You can not change this user!", status: "fail" };

    await this.deleteAvatar(id);

    const avatarUrl = await this.cloudinaryService.uploadImage(file, 'products');

    const updateProductDto: UpdateProductDto = { avatar: avatarUrl };

    await this.update("", id, updateProductDto, false);

    return { status: 'success', response: 'Avatar updated successfully', avatarUrl };
  }

  async deleteAvatar(id: any): Promise<any> {
    const product = await this.findOne(id);

    if (product._source.avatar) {
      const publicId = product._source.avatar.split('/').slice(-2).join('/').split('.').slice(0, -1).join('.');

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

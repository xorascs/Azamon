import { forwardRef, Injectable, Inject } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';

import { CustomResponse } from 'config';
import { Category } from './entity/category.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { ProductsService } from 'src/products/products.service';
import { SearchData } from 'src/elastic/elastic.service';
import { RedisService } from 'src/redis/redis.service';

const productsIndex = "products";
const CATEGORIES_REDIS_KEY = "categories:all"; // Redis key for the list of all categories

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private readonly categoriesRepository: Repository<Category>,
        private readonly cloudinaryService: CloudinaryService,
        private readonly redisService: RedisService,
        @Inject(forwardRef(() => ProductsService))
        private readonly productsService: ProductsService,
    ) {}

    async saveWithRedis(category: Category): Promise<void> {
        // Step 1: Save the category in the database
        await this.categoriesRepository.save(category);
    
        // Step 2: Cache the category in Redis using HMSET
        const categoryKey = `category:${category.id}`;
        if (await this.redisService.exists(categoryKey)) {
            await this.removeFromRedis(category);
        }
        
        await this.redisService.hmset(categoryKey, {
            id: category.id,
            name: category.name,
            avatar: category.avatar || "",
            productCount: category.productCount || 0,
        });
    
        // Step 3: Add the category ID to the list of all categories in Redis
        await this.redisService.lpush(CATEGORIES_REDIS_KEY, category.id.toString());

        // Step 4: Add the category name to the secondary index
        await this.redisService.hset("category_names", category.name, category.id.toString());
    }

    async removeFromRedis(category: Category): Promise<any> {
        const categoryKey = `category:${category.id}`;
        await this.redisService.hdel("category_names", category.name);
        await this.redisService.lrem(CATEGORIES_REDIS_KEY, 0, category.id.toString()); 
        await this.redisService.del(categoryKey); 
    }

    async findAll(): Promise<Category[]> {  
        // Step 1: Check if categories are already cached in Redis
        const categoryIds = await this.redisService.lrange(CATEGORIES_REDIS_KEY, 0, -1);
        if (categoryIds.length > 0) {
            const categories = await Promise.all(
                categoryIds.map(async (id) => {
                    const categoryKey = `category:${id}`;
                    const categoryData = await this.redisService.hgetall(categoryKey);
                    return categoryData;
                })
            );
            return categories.map((data) => ({
                id: parseInt(data.id),
                name: data.name,
                avatar: data.avatar,
                productCount: parseInt(data.productCount),
            }));
        }

        // Step 2: Fetch categories from the database
        const categories = await this.categoriesRepository.find();

        // Step 3: Cache the fetched categories in Redis
        for (const category of categories) {
            await this.saveWithRedis(category);
        }

        return categories;
    }

    async findByName(name: string): Promise<Category | null> {
        // Step 1: Check the secondary index for the category ID
        const categoryId = await this.redisService.hget("category_names", name);
        if (categoryId) {
            console.log(`Category "${name}" found in Redis secondary index.`);
            const categoryKey = `category:${categoryId}`;
            const categoryData = await this.redisService.hgetall(categoryKey);
            if (categoryData) {
                return {
                    id: parseInt(categoryData.id),
                    name: categoryData.name,
                    avatar: categoryData.avatar,
                    productCount: parseInt(categoryData.productCount),
                };
            }
        }
    
        // Step 2: Fetch the category from the database
        const category = await this.categoriesRepository.findOne({ where: { name } });
    
        // Step 3: Cache the fetched category in Redis if it exists
        if (category) {
            await this.saveWithRedis(category);
        }
    
        return category || null;
    }

    async isCategoryExists(name: string): Promise<boolean> {
        return await this.findByName(name) !== null;
    }

    async changeProductsCount(name: string, exec: 'add' | 'del'): Promise<any> {
        try {
          // Use atomic update to increment or decrement productsCount directly in the database
          const incrementValue = exec === 'add' ? 1 : -1;
      
          await this.categoriesRepository
            .createQueryBuilder()
            .update(Category)
            .set({
                productCount: () =>
                `GREATEST(COALESCE(productCount, 0) + ${incrementValue}, 0)`,
            })
            .where("name = :name", { name })
            .execute();
        
        const redisValue = await this.findByName(name);
        if (redisValue) {
            await this.redisService.hmset(`category:${redisValue.id}`, {
                productCount: redisValue.productCount + incrementValue,
            });
        }
        } catch (error) {
          console.error(`Error updating products count for category "${name}":`, error);
          throw new Error(`Failed to update products count for category "${name}"`);
        }
      }

    async create(createCategoryDto: CreateCategoryDto): Promise<CustomResponse> {
        if (createCategoryDto.name === "all") return {status: "error", response: "You can not create category with name 'all'!" }

        const category = this.categoriesRepository.create(createCategoryDto);
        await this.saveWithRedis(category);
        return { response: "Category successfully created!", status: "success" };
    }

    async remove(id: number): Promise<CustomResponse> {
        const category = await this.categoriesRepository.findOne({ where: { id } });
        if (!category) return { response: "Category not found!", status: "error" };
    
        const searchData: SearchData = { index: productsIndex, field: "category", value: category.name, searchType: "match" };
        const products = await this.productsService.findAll(searchData);
        for (const product of products) {
            await this.productsService.remove("", product._id, false);
        }
    
        await this.deleteCategoryAvatar(category);

        await this.removeFromRedis(category);
        await this.categoriesRepository.remove(category);
    
        return { response: "Category successfully deleted!", status: "success" };
    }

    async updateAvatar(id: number, file: Express.Multer.File): Promise<{ status: string; response: string; avatarUrl?: string }> {
        const category = await this.categoriesRepository.findOne({ where: { id } });
        if (!category) return { response: "Category not found!", status: "error" };

        await this.deleteCategoryAvatar(category);
    
        // Upload the new avatar image to Cloudinary
        const avatarUrl = await this.cloudinaryService.uploadImage(file, 'categories');
    
        // Update the user's avatar in the database
        category.avatar = avatarUrl;
        await this.saveWithRedis(category);
    
        return { status: 'success', response: 'User avatar successfully updated!', avatarUrl };
    }
    
    async deleteCategoryAvatar(category: Category): Promise<any> {
        // Check if the user already has an avatar and delete it if exists
        if (category.avatar) {
            // Extract the public ID of the old avatar image from the URL (assuming Cloudinary format)
            const publicId = category.avatar.split('/').slice(-2).join('/').split('.').slice(0, -1).join('.');

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

import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ElasticService, SearchData } from 'src/elastic/elastic.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { ProductsService } from 'src/products/products.service';
import { CustomResponse } from 'config';
import { generateRandomId } from 'config';
import { UsersService } from 'src/users/users.service';

const indexName = "ratings";

@Injectable()
export class RatingService {
    constructor(
        private readonly elasticService: ElasticService,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        @Inject(forwardRef(() => ProductsService))
        private readonly productsService: ProductsService,
    ) {
        if (!this.elasticService.indexExists(indexName).then((exists) =>!exists)) {
            this.elasticService.createIndex(indexName);
        }
    }

    async findAll(): Promise<any> {
        return await this.elasticService.searchData({ 
            index: indexName, 
            field: "", 
            searchType: "all"
        });
    }

    async getRatings(productId: string): Promise<any> {
        // Step 1: Search for ratings in Elasticsearch
        const searchData: SearchData = {
          index: indexName,
          field: "productId",
          value: productId,
          searchType: "match",
        };
        const ratingsResponse = await this.elasticService.searchData(searchData);
      
        // Step 2: Extract the ratings from the Elasticsearch response
        const ratings = ratingsResponse.map((item: any) => ({
          id: item._id,
          userId: item._source.userId,
          comment: item._source.comment,
          rating: item._source.rating,
          createdAt: item._source.createdAt,
        }));
      
        // Step 3: Fetch user details for each rating
        const enrichedRatings = await Promise.all(
          ratings.map(async (rating) => {
            const user = await this.usersService.findOne(rating.userId); // Fetch user by ID
            return {
              ...rating,
              userLogin: user?.login || "Unknown", // Default to "Unknown" if login is missing
              userAvatar: user?.avatar || null,   // Default to null if avatar is missing
            };
          })
        );
      
        // Step 4: Return the enriched ratings
        return enrichedRatings;
    }

    async deleteRatings(productId: string): Promise<any> {
        try {
            // Fetch all ratings for the given productId
            const ratings = await this.getRatings(productId);

            // Delete each rating individually
            for (const rating of ratings) {
                await this.deleteRating(rating._id); // Use `_id` to delete each rating
            }

            // Update the product's average rating to 0 after deleting all ratings
            await this.productsService.update("", productId, { rating: 0 }, false);

            return { message: `All ratings for product ${productId} have been deleted.` };
        } catch (error) {
            console.error('Error deleting ratings:', error);
            throw error; // Re-throw the error for further handling
        }
    }

    async findOne(ratingId: string): Promise<any> {
        return await this.elasticService.getData(indexName, ratingId);
    }

    async updateProductRating(productId: string, num: number, exec: 'increment' | 'decrement' = 'increment') {
        try {
            // Fetch the product data
            const productData = await this.productsService.findOne(productId);
            if (!productData) {
                throw new Error('Product not found');
            }
    
            // Extract rating and rating count from the product data
            const totalRatings = parseFloat(productData._source.rating); // Use parseFloat for decimals
            const ratingsLength = parseInt(productData._source.ratingQuantity, 10); // Ensure proper integer parsing
    
            let averageRating: number;
            let updatedRateLength: number;
    
            if (exec === 'increment') {
                // Add a new rating
                updatedRateLength = ratingsLength + 1;
                averageRating = (totalRatings * ratingsLength + num) / updatedRateLength;
            } else if (exec === 'decrement') {
                // Remove a rating
                if (ratingsLength === 0) {
                    throw new Error('No ratings to delete');
                }
                updatedRateLength = ratingsLength - 1;
                averageRating = updatedRateLength > 0 ? (totalRatings * ratingsLength - num) / updatedRateLength : 0;
            } else {
                throw new Error('Invalid operation');
            }
    
            // Update the product's rating and rating count
            await this.productsService.update('', productId, { 
                rating: parseFloat(averageRating.toFixed(2)), // Round to 2 decimal places for precision
                ratingQuantity: updatedRateLength 
            }, false);
    
        } catch (error) {
            console.error('Error updating product rating:', error);
            throw error; // Re-throw the error for further handling
        }
    }

    async addRating(createRating: CreateRatingDto): Promise<CustomResponse> {
        await this.productsService.findOne(createRating.productId);

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
        
        createRating.createdAt = new Date().toISOString();

        await this.elasticService.addData(indexName, rndId, createRating);
        await this.updateProductRating(createRating.productId, createRating.rating, 'increment')
        return { status: "success", response: "Comment added successfully!" };
    }

    async deleteRating(id: string): Promise<CustomResponse> {
        const rating = await this.findOne(id);

        await this.updateProductRating(rating._source.productId, rating._source.rating, 'decrement')
        await this.elasticService.delete(indexName, id);
        return { status: "success", response: "Comment deleted successfully!" };
    }
}

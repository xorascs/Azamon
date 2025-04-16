import { IsNotEmpty } from "class-validator";

export class CreateProductDto {
    @IsNotEmpty()
    userId: string;
    @IsNotEmpty()
    name: string;
    @IsNotEmpty()
    description: string;
    @IsNotEmpty()
    price: number;
    @IsNotEmpty()
    category: string;

    rating?: number;
    ratingQuantity?: number;

    avatar?: string;
}

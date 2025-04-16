import { IsNotEmpty, Max, Min } from "class-validator";

export class CreateRatingDto {
    @IsNotEmpty()
    productId: string;
    @IsNotEmpty()
    userId: number;
    @IsNotEmpty()
    @Min(1)
    @Max(5)
    rating: number;
    @IsNotEmpty()
    comment: string;

    createdAt: string;
}
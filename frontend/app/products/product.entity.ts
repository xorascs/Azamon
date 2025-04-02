export type Product = {
    id: string;
    userId: string;
    name: string;
    description: string;
    price: number;
    category: string;
    rating?: number;
    ratingQuantity?: number;
    avatar?: string;
}
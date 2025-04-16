import { IsNotEmpty } from "class-validator";

export class CreatePromoDto {
    @IsNotEmpty()
    name: string;
    @IsNotEmpty()
    fee: number;
    @IsNotEmpty()
    activeUntil: string;
    @IsNotEmpty()
    status: string;
    @IsNotEmpty()
    amount: number;
}
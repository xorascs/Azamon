import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export enum Roles {
    USER = 'USER',
    ADMIN = 'ADMIN',
}

export class CreateUserDto {
    avatar?: string;

    @IsString()
    @MinLength(5)
    @MaxLength(25)
    @IsNotEmpty()
    login: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    password: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(Roles)
    role: string;

    products?: string[];
    cart?: string[];

    createdAt: Date;
    updatedAt: Date;
}

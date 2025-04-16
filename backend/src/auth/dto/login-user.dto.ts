import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginUserDto {
    @IsString()
    @MinLength(5)
    @IsNotEmpty()
    login: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    password: string;
}
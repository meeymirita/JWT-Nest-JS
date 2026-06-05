import {IsString,IsNotEmpty, MaxLength, IsEmail, MinLength } from 'class-validator';
export class RegisterRequest {
    @IsString({message: 'Имя должно быть строкой'})
    @IsNotEmpty({message: 'Обязательно для заполнения'})
    @MinLength(3, { message: 'Имя не должно быть меньше 3 символов'})
    @MaxLength(50, { message: 'Имя не должно быть больше 50 символов'})
    name: string;
    
    
    @IsEmail({}, {message: 'Некорректный email'})
    @IsNotEmpty({message: 'Обязательно для заполнения'})
    @MaxLength(50, { message: 'Email не должно быть больше 50 символов'})
    email: string;

    @IsString({message: 'Пароль должно быть строкой'})
    @IsNotEmpty({message: 'Обязательно для заполнения'})
    @MinLength(8, { message: 'Пароль не должно быть меньше 8 символов'})
    @MaxLength(50, { message: 'Пароль не должно быть больше 50 символов'})
    password: string;
}
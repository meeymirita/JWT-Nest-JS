import { ApiProperty } from '@nestjs/swagger';
import {IsString,IsNotEmpty, MaxLength, IsEmail, MinLength } from 'class-validator';
export class LoginRequest {
    
    @ApiProperty({ 
        description: 'Email пользователя',
        example: 'john.doe@example.com',
        required: true,
    })
    @IsEmail({}, {message: 'Некорректный email'})
    @IsNotEmpty({message: 'Обязательно для заполнения'})
    @MaxLength(50, { message: 'Email не должно быть больше 50 символов'})
    email!: string;

    @ApiProperty({ 
        description: 'Пароль пользователя',
        example: 'password123',
        required: true,
        minLength: 8,
        maxLength: 50,
    })
    @IsString({message: 'Пароль должно быть строкой'})
    @IsNotEmpty({message: 'Обязательно для заполнения'})
    @MinLength(8, { message: 'Пароль не должно быть меньше 8 символов'})
    @MaxLength(50, { message: 'Пароль не должно быть больше 50 символов'})
    password!: string;
}
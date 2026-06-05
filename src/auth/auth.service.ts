import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterRequest } from './dto/register.dto';
import { ConflictException } from '@nestjs/common';
import { hash } from 'argon2';

@Injectable()
export class AuthService {
// 19:03
    private readonly JWT_SECRET: string;
    private readonly JWT_ACCESS_TOKEN_TTL: string;
    private readonly JWT_REFRESH_TOKEN_TTL: string;

    constructor(private readonly prisma: PrismaService) {}
    

    async register(dto: RegisterRequest) {
        const  { name, email, password } = dto;
        
        const existsUser = await this.prisma.client.user.findUnique({
            where: {
                email,
            },
        });

        if (existsUser) {
            throw new ConflictException('Пользователь с таким email уже существует');

        }
        
        const user = await this.prisma.client.user.create({
            data: {
                name,
                email,
                password: await hash(password),
            },
        });
        
        return user;
    }
}

 



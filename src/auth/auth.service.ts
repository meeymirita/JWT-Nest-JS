import {
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import type { Request, Response } from 'express';
import type { SignOptions } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { isDev } from '../utils/is-dev-utils';
import { LoginRequest } from './dto/login.dto';
import { RegisterRequest } from './dto/register.dto';
import type { JwtPayload } from './interfaces/jwt.interface';
import { SAFE_USER_SELECT, SafeUser } from './interfaces/user.interface';

@Injectable()
export class AuthService {
    private readonly JWT_ACCESS_TOKEN_TTL: NonNullable<SignOptions['expiresIn']>;
    private readonly JWT_REFRESH_TOKEN_TTL: NonNullable<SignOptions['expiresIn']>;
    private readonly COOKIE_DOMAIN: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ) {
        this.JWT_ACCESS_TOKEN_TTL = this.configService.getOrThrow<string>(
            'JWT_ACCESS_TOKEN_TTL',
        ) as NonNullable<SignOptions['expiresIn']>;
        this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<string>(
            'JWT_REFRESH_TOKEN_TTL',
        ) as NonNullable<SignOptions['expiresIn']>;
        this.COOKIE_DOMAIN = this.configService.getOrThrow<string>('COOKIE_DOMAIN');
    }

    async register(response: Response, dto: RegisterRequest) {
        const { name, email, password } = dto;

        const existsUser = await this.prisma.client.user.findUnique({
            where: { email },
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

        return this.auth(response, user.id);
    }

    async login(response: Response, dto: LoginRequest) {
        const { email, password } = dto;
        const user = await this.prisma.client.user.findUnique({
            where: { email },
            select: { id: true, password: true },
        });

        if (!user || !(await verify(user.password, password))) {
            throw new UnauthorizedException('Неверный email или пароль');
        }

        return this.auth(response, user.id);
    }

    async logout(request: Request, response: Response) {
        const refreshToken = request.cookies['refreshToken'];
        if (!refreshToken) {
            throw new UnauthorizedException('Вы не авторизованы');
        }

        this.setCookie(response, '', new Date(0));
        return { message: 'Вы успешно вышли из системы' };
    }

    async validate(id: string): Promise<SafeUser> {
        const user = await this.prisma.client.user.findUnique({
            where: { id },
            select: SAFE_USER_SELECT,
        });

        if (!user) {
            throw new UnauthorizedException('Пользователь не найден');
        }

        return user;
    }

    async refresh(request: Request, response: Response) {
        const refreshToken = request.cookies['refreshToken'];
        if (!refreshToken) {
            throw new UnauthorizedException('Недействительный токен');
        }

        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken);
            const user = await this.prisma.client.user.findUnique({
                where: { id: payload.userId },
                select: { id: true },
            });

            if (!user) {
                throw new UnauthorizedException('Недействительный токен');
            }

            return this.auth(response, user.id);
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }

            throw new UnauthorizedException('Недействительный токен');
        }
    }

    private async auth(response: Response, id: string) {
        const { accessToken, refreshToken } = await this.generateTokens(id);
        const decoded = this.jwtService.decode(refreshToken) as { exp: number };
        this.setCookie(response, refreshToken, new Date(decoded.exp * 1000));
        return { accessToken };
    }

    private async generateTokens(userId: string) {
        const payload: JwtPayload = { userId };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.JWT_ACCESS_TOKEN_TTL,
        });

        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: this.JWT_REFRESH_TOKEN_TTL,
        });

        return { accessToken, refreshToken };
    }

    private setCookie(response: Response, value: string, expires: Date) {
        const dev = isDev(this.configService);

        response.cookie('refreshToken', value, {
            httpOnly: true,
            domain: this.COOKIE_DOMAIN,
            secure: !dev,
            sameSite: dev ? 'lax' : 'strict',
            expires,
        });
    }
}

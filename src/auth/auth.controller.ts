import { ApiBadRequestResponse, ApiBody, ApiConflictResponse, ApiOkResponse, ApiResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginRequest } from './dto/login.dto';
import { RegisterRequest } from './dto/register.dto';
import { Controller, Post, Body, HttpCode, HttpStatus, Res, Req, Get } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthResponse } from './dto/auth.dto';
import { UserResponse } from './dto/user.dto';
import { Authorization } from './decorators/authorization.decorator';
import { Authorized } from './decorators/authorized.decorator';
import { SafeUser } from './interfaces/user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @ApiOperation({ 
    summary: 'Регистрация пользователя',
    description: 'Регистрация пользователя'
  })
  @ApiBody({ type: RegisterRequest })
  @ApiOkResponse({ type: AuthResponse })
  @ApiBadRequestResponse({ description: 'Некорректные данные' })
  @ApiConflictResponse({ description: 'Пользователь уже зарегистрирован' })
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Res({ passthrough: true }) response: Response, @Body() dto: RegisterRequest) {
    return this.authService.register(response, dto);
  }

  @ApiOperation({ 
    summary: 'Вход пользователя',
    description: 'Вход пользователя'
  })
  @ApiBody({ type: LoginRequest })
  @ApiOkResponse({ type: AuthResponse })
  @ApiBadRequestResponse({ description: 'Некорректные данные' })
  @ApiUnauthorizedResponse({ description: 'Неверный email или пароль' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Res({ passthrough: true }) response: Response, @Body() dto: LoginRequest) {
    return this.authService.login(response, dto);
  }

  @ApiOperation({ 
    summary: 'Обновление токена',
    description: 'Обновление токена'
  })
  @ApiOkResponse({ type: AuthResponse })
  @ApiBadRequestResponse({ description: 'Некорректные данные' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return this.authService.refresh(request, response);
  }

  @ApiOperation({ 
    summary: 'Выход пользователя',
    description: 'Выход пользователя'
  })
  @ApiResponse({ status: 200, description: 'Пользователь успешно вышел из системы' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(request, response);
  }

  @Authorization()
  @ApiOperation({ 
    summary: 'Получение информации о пользователе',
    description: 'Получение информации о пользователе'
  })
  @ApiOkResponse({ type: UserResponse })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @HttpCode(HttpStatus.OK)
  @Get('me')
  async me(@Authorized() user: SafeUser) {
    return user;
  }
}

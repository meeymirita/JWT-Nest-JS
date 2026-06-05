import { AuthService } from './auth.service';
import { RegisterRequest } from './dto/register.dto';
import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body() dto: RegisterRequest) {
    console.log(dto);
    return this.authService.register(dto);
  }
}

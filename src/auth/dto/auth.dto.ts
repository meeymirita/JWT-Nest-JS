import { ApiProperty } from "@nestjs/swagger";

export class AuthResponse {
    @ApiProperty({ description: 'Токен доступа' })
    accessToken!: string;
}   
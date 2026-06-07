import { ApiProperty } from '@nestjs/swagger';

export class UserResponse {
    @ApiProperty({ description: 'ID пользователя' })
    id!: string;

    @ApiProperty({ description: 'Имя пользователя' })
    name!: string;

    @ApiProperty({ description: 'Email пользователя' })
    email!: string;

    @ApiProperty({ description: 'Дата создания' })
    createdAt!: Date;

    @ApiProperty({ description: 'Дата обновления' })
    updatedAt!: Date;
}

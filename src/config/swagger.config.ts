import { DocumentBuilder } from "@nestjs/swagger";
export function swaggerConfig() {
    return new DocumentBuilder()
    .setTitle('Nest API')
    .setDescription('Nest API for course')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
}
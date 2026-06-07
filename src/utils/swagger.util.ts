import { INestApplication } from "@nestjs/common";
import { SwaggerModule } from "@nestjs/swagger";
import { swaggerConfig } from "../config/swagger.config";

export function setupSwagger(app: INestApplication) {
     // swagger
    const config = swaggerConfig();
    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api', app, document, {
        jsonDocumentUrl: '/api-json',
        yamlDocumentUrl: '/api-yaml',
        customSiteTitle: 'Nest API',
    });
}
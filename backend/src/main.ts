import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

// Module principal (à créer avec tous les imports)
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuration globale
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  // Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('MA Invoice API')
    .setDescription('API de gestion de stock et facturation - Conformité marocaine (DGI, CNDP, PCG)')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentification')
    .addTag('users', 'Gestion des utilisateurs')
    .addTag('customers', 'Gestion des clients')
    .addTag('products', 'Gestion des produits')
    .addTag('documents', 'Documents commerciaux (Devis, Factures, BL, Avoirs)')
    .addTag('stock', 'Mouvements de stock')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🇲🇦 Application démarrée sur http://localhost:${port}`);
  console.log(`📚 Documentation API: http://localhost:${port}/api/docs`);
}

// Placeholder pour AppModule (sera complété)
class AppModule {}

bootstrap();

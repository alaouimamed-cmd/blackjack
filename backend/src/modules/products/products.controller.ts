import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, StockAdjustmentDto } from './dto/product.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('products')
@UseGuards(AuthGuard, RolesGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
  ) {
    return this.productsService.findAll(
      parseInt(page as any),
      parseInt(limit as any),
      search,
      categoryId,
      lowStockOnly === 'true',
    );
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.RESPONSABLE_STOCK, UserRole.COMPTABLE)
  async getStats() {
    return this.productsService.getStats();
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.RESPONSABLE_STOCK)
  async getLowStock(@Query('threshold') threshold?: number) {
    return this.productsService.getLowStockProducts(threshold ? parseInt(threshold) : undefined);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RESPONSABLE_STOCK)
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.RESPONSABLE_STOCK)
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }

  @Post(':id/stock-adjustment')
  @Roles(UserRole.ADMIN, UserRole.RESPONSABLE_STOCK)
  async adjustStock(
    @Param('id') productId: string,
    @Body() dto: StockAdjustmentDto,
    @Request() req,
  ) {
    return this.productsService.adjustStock(
      productId,
      dto.quantity,
      dto.reason,
      req.user.id,
    );
  }
}

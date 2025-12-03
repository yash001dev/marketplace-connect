import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    try {
      const result = await this.productService.createProduct(
        createProductDto,
        images,
      );
      return {
        success: true,
        data: result,
        message: 'Product created successfully',
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Failed to create product',
        error: error.response?.data || error.message,
      });
    }
  }
}

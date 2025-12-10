import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Get,
  UploadedFile,
} from "@nestjs/common";
import { FilesInterceptor, FileInterceptor } from "@nestjs/platform-express";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { AIVisionService } from "../ai/ai-vision.service";
import {
  BulkUploadService,
  BulkUploadResult,
  BulkUploadDefaults,
} from "./bulk-upload.service";
import {
  BulkUploadAIService,
  BulkUploadAIResult,
  BulkUploadAIDefaults,
} from "./bulk-upload-ai.service";

@Controller("products")
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly aiVisionService: AIVisionService,
    private readonly bulkUploadService: BulkUploadService,
    private readonly bulkUploadAIService: BulkUploadAIService
  ) {}

  @Post("analyze-image")
  @UseInterceptors(FilesInterceptor("images", 10))
  async analyzeProductImage(@UploadedFiles() images?: Express.Multer.File[]) {
    if (!images || images.length === 0) {
      throw new BadRequestException("Please upload at least one image");
    }

    try {
      // Check if AI Vision is configured
      if (!this.aiVisionService.isConfigured()) {
        throw new BadRequestException(
          "AI Vision not configured. Please add GEMINI_API_KEY to .env file. Get your free key at: https://aistudio.google.com/app/apikey"
        );
      }

      // Analyze the first image (main product image)
      const analysis = await this.aiVisionService.analyzeProductImage(
        images[0].buffer,
        images[0].mimetype
      );

      return {
        success: true,
        analysis,
        imageCount: images.length,
        message: "Product image analyzed successfully",
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message || "Failed to analyze image",
        error: error.message,
      });
    }
  }

  @Post("create-with-ai")
  @UseInterceptors(FilesInterceptor("images", 10))
  async createProductWithAI(
    @Body() body: any,
    @UploadedFiles() images?: Express.Multer.File[]
  ) {
    if (!images || images.length === 0) {
      throw new BadRequestException("Please upload at least one image");
    }

    try {
      // Check if AI Vision is configured
      if (!this.aiVisionService.isConfigured()) {
        throw new BadRequestException("AI Vision not configured");
      }

      // Step 1: Analyze images with AI
      const analysis = await this.aiVisionService.analyzeProductImage(
        images[0].buffer,
        images[0].mimetype
      );

      // Step 2: Use AI-generated data (allow override from body)
      const productDto: CreateProductDto = {
        title: body.title || analysis.title,
        description: body.description || analysis.description,
        marketplace: body.marketplace,
      };

      // Step 3: Create product on selected marketplace
      const result = await this.productService.createProduct(
        productDto,
        images
      );

      return {
        success: true,
        data: result,
        aiAnalysis: analysis,
        message: "Product created successfully with AI assistance",
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message || "Failed to create product",
        error: error.message,
      });
    }
  }

  @Get("ai-status")
  async getAIStatus() {
    const testResult = await this.aiVisionService.testConnection();
    return {
      configured: this.aiVisionService.isConfigured(),
      ...testResult,
    };
  }

  @Post()
  @UseInterceptors(FilesInterceptor("images", 10))
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() images?: Express.Multer.File[]
  ) {
    try {
      const result = await this.productService.createProduct(
        createProductDto,
        images
      );
      return {
        success: true,
        data: result,
        message: "Product created successfully",
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message || "Failed to create product",
        error: error.response?.data || error.message,
      });
    }
  }

  @Post("bulk-upload")
  @UseInterceptors(FileInterceptor("csvFile"))
  async bulkUploadProducts(
    @UploadedFile() csvFile: Express.Multer.File,
    @Body("marketplace") marketplace: string,
    @Body("bulkPrice") bulkPrice?: string,
    @Body("bulkCompareAtPrice") bulkCompareAtPrice?: string,
    @Body("bulkInventory") bulkInventory?: string,
    @Body("bulkTags") bulkTags?: string,
    @Body("bulkFeatures") bulkFeatures?: string
  ) {
    if (!csvFile) {
      throw new BadRequestException("Please upload a CSV file");
    }

    if (!marketplace) {
      throw new BadRequestException("Marketplace is required");
    }

    try {
      // Build defaults object
      const defaults: BulkUploadDefaults = {
        price: bulkPrice ? parseFloat(bulkPrice) : undefined,
        compareAtPrice: bulkCompareAtPrice
          ? parseFloat(bulkCompareAtPrice)
          : undefined,
        inventory: bulkInventory ? parseInt(bulkInventory, 10) : undefined,
        tags: bulkTags || undefined,
        features: bulkFeatures || undefined,
      };

      const results = await this.bulkUploadService.processBulkUpload(
        csvFile,
        marketplace,
        defaults
      );

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;

      return {
        success: true,
        totalProcessed: results.length,
        successCount,
        failedCount,
        results,
        message: `Bulk upload completed. ${successCount} succeeded, ${failedCount} failed.`,
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message || "Failed to process bulk upload",
        error: error.message,
      });
    }
  }

  @Post("bulk-upload-ai")
  @UseInterceptors(FileInterceptor("csvFile"))
  async bulkUploadProductsWithAI(
    @UploadedFile() csvFile: Express.Multer.File,
    @Body("marketplace") marketplace: string,
    @Body("bulkPrice") bulkPrice?: string,
    @Body("bulkCompareAtPrice") bulkCompareAtPrice?: string,
    @Body("bulkInventory") bulkInventory?: string,
    @Body("bulkTags") bulkTags?: string,
    @Body("bulkFeatures") bulkFeatures?: string
  ) {
    if (!csvFile) {
      throw new BadRequestException("Please upload a CSV file");
    }

    if (!marketplace) {
      throw new BadRequestException("Marketplace is required");
    }

    // Check if AI is configured
    if (!this.aiVisionService.isConfigured()) {
      throw new BadRequestException(
        "AI Vision not configured. Please add GEMINI_API_KEY to .env file. Get your free key at: https://aistudio.google.com/app/apikey"
      );
    }

    try {
      // Build defaults object
      const defaults: BulkUploadAIDefaults = {
        price: bulkPrice ? parseFloat(bulkPrice) : undefined,
        compareAtPrice: bulkCompareAtPrice
          ? parseFloat(bulkCompareAtPrice)
          : undefined,
        inventory: bulkInventory ? parseInt(bulkInventory, 10) : undefined,
        tags: bulkTags || undefined,
        features: bulkFeatures || undefined,
      };

      const results = await this.bulkUploadAIService.processBulkUploadWithAI(
        csvFile,
        marketplace,
        defaults
      );

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;

      return {
        success: true,
        totalProcessed: results.length,
        successCount,
        failedCount,
        results,
        message: `Bulk upload with AI completed. ${successCount} succeeded, ${failedCount} failed.`,
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message || "Failed to process bulk upload with AI",
        error: error.message,
      });
    }
  }
}

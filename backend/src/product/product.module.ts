import { Module } from "@nestjs/common";
import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";
import { MarketplaceModule } from "../marketplace/marketplace.module";
import { AIModule } from "../ai/ai.module";
import { BulkUploadService } from "./bulk-upload.service";
import { BulkUploadAIService } from "./bulk-upload-ai.service";
import { MetaUpdateService } from "./meta-update.service";
import { BulkUploadVariantService } from "./bulk-upload-variant.service";

@Module({
  imports: [MarketplaceModule, AIModule],
  controllers: [ProductController],
  providers: [
    ProductService,
    BulkUploadService,
    BulkUploadAIService,
    MetaUpdateService,
    BulkUploadVariantService,
  ],
})
export class ProductModule {}

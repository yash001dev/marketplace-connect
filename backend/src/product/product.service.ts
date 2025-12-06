import { Injectable } from "@nestjs/common";
import { CreateProductDto, MarketplaceType } from "./dto/create-product.dto";
import { ShopifyService } from "../marketplace/shopify/shopify.service";
import { AmazonService } from "../marketplace/amazon/amazon.service";
import { MeeshoService } from "../marketplace/meesho/meesho.service";

@Injectable()
export class ProductService {
  constructor(
    private readonly shopifyService: ShopifyService,
    private readonly amazonService: AmazonService,
    private readonly meeshoService: MeeshoService
  ) {}

  async createProduct(
    createProductDto: CreateProductDto,
    images?: Express.Multer.File[]
  ) {
    const { marketplace, title, description, tags, features } =
      createProductDto;

    switch (marketplace) {
      case MarketplaceType.SHOPIFY:
        return await this.shopifyService.createProductWithMedia(
          title,
          description,
          images,
          tags,
          features
        );

      case MarketplaceType.AMAZON:
        return await this.amazonService.createProduct(
          title,
          description,
          images
        );

      case MarketplaceType.MEESHO:
        return await this.meeshoService.createProduct(
          title,
          description,
          images
        );

      default:
        throw new Error(`Unsupported marketplace: ${marketplace}`);
    }
  }
}

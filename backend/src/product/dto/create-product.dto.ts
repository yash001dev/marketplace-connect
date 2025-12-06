import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsEnum,
} from "class-validator";

export enum MarketplaceType {
  SHOPIFY = "shopify",
  AMAZON = "amazon",
  MEESHO = "meesho",
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(MarketplaceType)
  @IsNotEmpty()
  marketplace: MarketplaceType;

  @IsArray()
  @IsOptional()
  imageUrls?: string[];

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  @IsOptional()
  features?: string;
}

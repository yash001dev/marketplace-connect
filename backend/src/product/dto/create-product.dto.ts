import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsEnum,
  IsNumber,
  IsPositive,
} from "class-validator";
import { Transform } from "class-transformer";

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

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsPositive()
  @IsOptional()
  compareAtPrice?: number;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  inventory?: number;
}

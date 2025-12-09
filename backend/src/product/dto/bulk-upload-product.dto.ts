import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class BulkProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  folderPath: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  compareAtPrice?: number;

  @IsNumber()
  @IsOptional()
  inventory?: number;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  @IsOptional()
  features?: string;
}

export class BulkUploadDto {
  @ValidateNested({ each: true })
  @Type(() => BulkProductDto)
  products: BulkProductDto[];
}

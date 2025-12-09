import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { ProductService } from "./product.service";
import { CreateProductDto, MarketplaceType } from "./dto/create-product.dto";

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

interface ImageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface BulkUploadResult {
  success: boolean;
  productTitle: string;
  error?: string;
  data?: any;
}

interface CSVRow {
  title: string;
  description: string;
  folderpath: string; // lowercase because headers are normalized
  price?: string;
  compareatprice?: string; // lowercase because headers are normalized
  inventory?: string;
  tags?: string;
  features?: string;
}

@Injectable()
export class BulkUploadService {
  private readonly logger = new Logger(BulkUploadService.name);

  constructor(private readonly productService: ProductService) {}

  /**
   * Process bulk upload from CSV file
   */
  async processBulkUpload(
    csvFile: Express.Multer.File,
    marketplace: string
  ): Promise<BulkUploadResult[]> {
    try {
      // Parse CSV
      const csvRows = await this.parseCSV(csvFile.buffer.toString("utf-8"));
      this.logger.log(`Parsed ${csvRows.length} products from CSV`);

      const results: BulkUploadResult[] = [];

      // Process each product
      for (const row of csvRows) {
        try {
          this.logger.log(`Processing product: ${row.title}`);

          // Validate required fields
          if (!row.title || !row.description || !row.folderpath) {
            results.push({
              success: false,
              productTitle: row.title || "Unknown",
              error:
                "Missing required fields (title, description, or folderPath)",
            });
            continue;
          }

          // Get images from folder
          const images = await this.getImagesFromFolder(row.folderpath);

          // Create product DTO
          const productDto: CreateProductDto = {
            title: row.title,
            description: row.description,
            marketplace: marketplace as MarketplaceType,
            price: row.price ? parseFloat(row.price) : undefined,
            compareAtPrice: row.compareatprice
              ? parseFloat(row.compareatprice)
              : undefined,
            inventory: row.inventory ? parseInt(row.inventory, 10) : undefined,
            tags: row.tags || "",
            features: row.features || "",
          };

          // Create product
          const result = await this.productService.createProduct(
            productDto,
            images as any[]
          );

          results.push({
            success: true,
            productTitle: row.title,
            data: result,
          });

          this.logger.log(`✓ Successfully created product: ${row.title}`);
        } catch (error) {
          this.logger.error(
            `✗ Failed to create product ${row.title}:`,
            error.message
          );
          results.push({
            success: false,
            productTitle: row.title,
            error: error.message || "Unknown error",
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error("Bulk upload failed:", error.message);
      throw error;
    }
  }

  /**
   * Parse CSV file
   */
  private async parseCSV(csvContent: string): Promise<CSVRow[]> {
    const lines = csvContent.split("\n").filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      throw new Error("CSV file is empty or missing header row");
    }

    // Parse header
    const headers = this.parseCSVLine(lines[0]);
    const rows: CSVRow[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);

      if (values.length === 0) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        // Normalize header: lowercase and remove spaces
        const normalizedHeader = header.toLowerCase().replace(/\s+/g, "");
        row[normalizedHeader] = values[index] || "";
      });

      // Log parsed row for debugging
      this.logger.debug(`Parsed row:`, row);

      rows.push(row as CSVRow);
    }

    return rows;
  }

  /**
   * Parse a single CSV line (handles quoted values with commas)
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current.trim());

    return result;
  }

  /**
   * Read all image files from a directory
   */
  async getImagesFromFolder(folderPath: string): Promise<ImageFile[]> {
    try {
      // Check if folder exists
      if (!fs.existsSync(folderPath)) {
        throw new Error(`Folder not found: ${folderPath}`);
      }

      const files = await readdir(folderPath);
      const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      const images: ImageFile[] = [];

      for (const file of files) {
        const filePath = path.join(folderPath, file);
        const fileStat = await stat(filePath);

        // Skip directories
        if (fileStat.isDirectory()) {
          continue;
        }

        const ext = path.extname(file).toLowerCase();
        if (imageExtensions.includes(ext)) {
          const buffer = await readFile(filePath);
          const mimetype = this.getMimeType(ext);

          images.push({
            buffer,
            originalname: file,
            mimetype,
            size: buffer.length,
          });

          this.logger.log(`Loaded image: ${file}`);
        }
      }

      if (images.length === 0) {
        throw new Error(`No images found in folder: ${folderPath}`);
      }

      this.logger.log(`Found ${images.length} images in ${folderPath}`);
      return images;
    } catch (error) {
      this.logger.error(`Error reading folder ${folderPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };
    return mimeTypes[extension] || "application/octet-stream";
  }

  /**
   * Validate folder path
   */
  validateFolderPath(folderPath: string): boolean {
    try {
      const stats = fs.statSync(folderPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }
}

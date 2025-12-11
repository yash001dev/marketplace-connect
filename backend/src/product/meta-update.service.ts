import { Injectable, Logger } from "@nestjs/common";
import { promisify } from "util";
import { ShopifyService } from "../marketplace/shopify/shopify.service";

const readFile = promisify(require("fs").readFile);

export interface MetaUpdateResult {
  success: boolean;
  url: string;
  type: "collection" | "product";
  identifier: string;
  error?: string;
  data?: any;
}

interface CSVRowMeta {
  pageurl: string;
  metatitle: string;
  metadescription: string;
}

@Injectable()
export class MetaUpdateService {
  private readonly logger = new Logger(MetaUpdateService.name);

  constructor(private readonly shopifyService: ShopifyService) {}

  /**
   * Process meta updates from CSV file
   */
  async processMetaUpdates(
    csvFile: Express.Multer.File,
    marketplace: string
  ): Promise<MetaUpdateResult[]> {
    try {
      // Parse CSV
      const csvRows = await this.parseCSV(csvFile.buffer.toString("utf-8"));
      this.logger.log(`Parsed ${csvRows.length} meta updates from CSV`);

      const results: MetaUpdateResult[] = [];

      // Process each row
      for (const row of csvRows) {
        try {
          this.logger.log(`Processing URL: ${row.pageurl}`);

          // Validate required fields
          if (!row.pageurl || !row.metatitle || !row.metadescription) {
            results.push({
              success: false,
              url: row.pageurl || "Unknown",
              type: "product",
              identifier: "Unknown",
              error:
                "Missing required fields (pageurl, metatitle, or metadescription)",
            });
            continue;
          }

          // Determine type and extract identifier from URL
          const urlInfo = this.parseURL(row.pageurl);

          if (!urlInfo) {
            results.push({
              success: false,
              url: row.pageurl,
              type: "product",
              identifier: "Unknown",
              error:
                "Invalid URL format. URL must contain /collections/ or /products/",
            });
            continue;
          }

          this.logger.log(
            `Updating ${urlInfo.type}: ${urlInfo.identifier} with meta title: "${row.metatitle}"`
          );

          // TODO: Call appropriate marketplace service to update meta
          // For now, simulate success
          const updateResult = await this.updateMeta(
            marketplace,
            urlInfo.type,
            urlInfo.identifier,
            row.metatitle,
            row.metadescription
          );

          results.push({
            success: true,
            url: row.pageurl,
            type: urlInfo.type,
            identifier: urlInfo.identifier,
            data: updateResult,
          });

          this.logger.log(
            `✓ Successfully updated meta for ${urlInfo.type}: ${urlInfo.identifier}`
          );
        } catch (error) {
          this.logger.error(
            `✗ Failed to update ${row.pageurl}:`,
            error.message
          );
          results.push({
            success: false,
            url: row.pageurl,
            type: "product",
            identifier: "Unknown",
            error: error.message || "Unknown error",
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error("Meta update failed:", error.message);
      throw error;
    }
  }

  /**
   * Parse URL to determine type and identifier
   */
  private parseURL(
    url: string
  ): { type: "collection" | "product"; identifier: string } | null {
    try {
      // Extract path from URL
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      // Check for /collections/
      if (path.includes("/collections/")) {
        const identifier = path.split("/collections/")[1].split("/")[0];
        return { type: "collection", identifier };
      }

      // Check for /products/
      if (path.includes("/products/")) {
        const identifier = path.split("/products/")[1].split("/")[0];
        return { type: "product", identifier };
      }

      return null;
    } catch (error) {
      this.logger.error(`Error parsing URL ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Update meta information for product or collection
   */
  private async updateMeta(
    marketplace: string,
    type: "collection" | "product",
    identifier: string,
    metaTitle: string,
    metaDescription: string
  ): Promise<any> {
    this.logger.log(`Updating ${marketplace} ${type} ${identifier} meta...`);

    if (marketplace.toLowerCase() === "shopify") {
      if (type === "collection") {
        return await this.updateShopifyCollectionMeta(
          identifier,
          metaTitle,
          metaDescription
        );
      } else {
        return await this.updateShopifyProductMeta(
          identifier,
          metaTitle,
          metaDescription
        );
      }
    }

    throw new Error(
      `Marketplace ${marketplace} is not yet supported for meta updates`
    );
  }

  /**
   * Update Shopify product meta (SEO title and description)
   */
  private async updateShopifyProductMeta(
    handle: string,
    metaTitle: string,
    metaDescription: string
  ): Promise<any> {
    try {
      // First, get the product ID by handle
      const productId = await this.getShopifyProductIdByHandle(handle);

      if (!productId) {
        throw new Error(`Product not found with handle: ${handle}`);
      }

      // Update product with SEO fields
      const mutation = `
        mutation productUpdate($input: ProductInput!) {
          productUpdate(input: $input) {
            product {
              id
              handle
              title
              seo {
                title
                description
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        input: {
          id: productId,
          seo: {
            title: metaTitle,
            description: metaDescription,
          },
        },
      };

      const response = await this.shopifyService.executeGraphQL(
        mutation,
        variables
      );

      if (response.productUpdate.userErrors.length > 0) {
        throw new Error(
          `Failed to update product meta: ${JSON.stringify(response.productUpdate.userErrors)}`
        );
      }

      this.logger.log(`✓ Updated product meta for: ${handle}`);
      return response.productUpdate.product;
    } catch (error) {
      this.logger.error(
        `Failed to update product meta for ${handle}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Update Shopify collection meta (SEO title and description)
   */
  private async updateShopifyCollectionMeta(
    handle: string,
    metaTitle: string,
    metaDescription: string
  ): Promise<any> {
    try {
      // First, get the collection ID by handle
      const collectionId = await this.getShopifyCollectionIdByHandle(handle);

      if (!collectionId) {
        throw new Error(`Collection not found with handle: ${handle}`);
      }

      // Update collection with SEO fields
      const mutation = `
        mutation collectionUpdate($input: CollectionInput!) {
          collectionUpdate(input: $input) {
            collection {
              id
              handle
              title
              seo {
                title
                description
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        input: {
          id: collectionId,
          seo: {
            title: metaTitle,
            description: metaDescription,
          },
        },
      };

      const response = await this.shopifyService.executeGraphQL(
        mutation,
        variables
      );

      if (response.collectionUpdate.userErrors.length > 0) {
        throw new Error(
          `Failed to update collection meta: ${JSON.stringify(response.collectionUpdate.userErrors)}`
        );
      }

      this.logger.log(`✓ Updated collection meta for: ${handle}`);
      return response.collectionUpdate.collection;
    } catch (error) {
      this.logger.error(
        `Failed to update collection meta for ${handle}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Get Shopify product ID by handle
   */
  private async getShopifyProductIdByHandle(
    handle: string
  ): Promise<string | null> {
    try {
      const query = `
        query getProductByHandle($handle: String!) {
          productByHandle(handle: $handle) {
            id
            handle
            title
          }
        }
      `;

      const variables = { handle };
      const response = await (this.shopifyService as any).graphqlRequest(
        query,
        variables
      );

      return response.productByHandle?.id || null;
    } catch (error) {
      this.logger.error(
        `Failed to get product ID for handle ${handle}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Get Shopify collection ID by handle
   */
  private async getShopifyCollectionIdByHandle(
    handle: string
  ): Promise<string | null> {
    try {
      const query = `
        query getCollectionByHandle($handle: String!) {
          collectionByHandle(handle: $handle) {
            id
            handle
            title
          }
        }
      `;

      const variables = { handle };
      const response = await this.shopifyService.executeGraphQL(
        query,
        variables
      );

      return response.collectionByHandle?.id || null;
    } catch (error) {
      this.logger.error(
        `Failed to get collection ID for handle ${handle}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Parse CSV file
   */
  private async parseCSV(csvContent: string): Promise<CSVRowMeta[]> {
    const lines = csvContent.split("\n").filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      throw new Error("CSV file is empty or missing header row");
    }

    // Parse header
    const headers = this.parseCSVLine(lines[0]);
    const rows: CSVRowMeta[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);

      if (values.length === 0) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        // Normalize header: lowercase and remove spaces/special chars
        const normalizedHeader = header
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[^a-z0-9]/g, "");
        row[normalizedHeader] = values[index] || "";
      });

      // Skip rows with empty URLs
      if (!row.pageurl || row.pageurl.trim() === "") {
        continue;
      }

      rows.push(row as CSVRowMeta);
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
}

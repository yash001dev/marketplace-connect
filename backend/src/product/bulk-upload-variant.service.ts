import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { ShopifyService } from "../marketplace/shopify/shopify.service";

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

interface ImageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface BulkUploadVariantResult {
  success: boolean;
  productTitle: string;
  variantsCreated: number;
  error?: string;
  data?: any;
}

interface CSVRowVariant {
  title: string;
  description: string;
  metatitle: string;
  metadescription: string;
  folderpath: string;
  variantoption: string; // Option name like "Material", "Color", "Size"
  variants: string; // Comma-separated variant names
  price?: string;
  compareatprice?: string;
  inventory?: string;
  tags?: string;
  features?: string;
}

export interface BulkUploadVariantDefaults {
  price?: number;
  compareAtPrice?: number;
  inventory?: number;
  tags?: string;
  features?: string;
}

@Injectable()
export class BulkUploadVariantService {
  private readonly logger = new Logger(BulkUploadVariantService.name);

  constructor(private readonly shopifyService: ShopifyService) {}

  /**
   * Process bulk upload with variants from CSV file
   */
  async processBulkUploadWithVariants(
    csvFile: Express.Multer.File,
    marketplace: string,
    defaults?: BulkUploadVariantDefaults
  ): Promise<BulkUploadVariantResult[]> {
    try {
      const csvRows = await this.parseCSV(csvFile.buffer.toString("utf-8"));
      this.logger.log(
        `Parsed ${csvRows.length} products with variants from CSV`
      );

      const results: BulkUploadVariantResult[] = [];

      for (const row of csvRows) {
        try {
          this.logger.log(`Processing product with variants: ${row.title}`);

          // Validate required fields
          if (
            !row.title ||
            !row.description ||
            !row.metatitle ||
            !row.metadescription ||
            !row.folderpath ||
            !row.variantoption ||
            !row.variants
          ) {
            results.push({
              success: false,
              productTitle: row.title || "Unknown",
              variantsCreated: 0,
              error:
                "Missing required fields (title, description, metaTitle, metaDescription, folderPath, variantOption, or variants)",
            });
            continue;
          }

          // Parse variants
          const variantNames = row.variants
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v);

          if (variantNames.length === 0) {
            results.push({
              success: false,
              productTitle: row.title,
              variantsCreated: 0,
              error: "No variants specified",
            });
            continue;
          }

          // Get images for each variant from subfolders
          const variantData = await this.getVariantImagesFromFolders(
            row.folderpath,
            variantNames
          );

          if (variantData.length === 0) {
            results.push({
              success: false,
              productTitle: row.title,
              variantsCreated: 0,
              error: "No variant images found in subfolders",
            });
            continue;
          }

          console.log("ROW:", row);

          // Parse and validate price/inventory from row, falling back to defaults
          const rowPrice = row.price?.trim()
            ? parseFloat(row.price.trim())
            : null;
          const rowCompareAtPrice = row.compareatprice?.trim()
            ? parseFloat(row.compareatprice.trim())
            : null;
          const rowInventory = row.inventory?.trim()
            ? parseInt(row.inventory.trim(), 10)
            : null;

          // Use row value if valid and greater than 0, otherwise use defaults
          // Treat 0 or negative values as "not provided" to use defaults
          const price =
            rowPrice !== null && !isNaN(rowPrice) && rowPrice > 0
              ? rowPrice
              : defaults?.price;
          const compareAtPrice =
            rowCompareAtPrice !== null &&
            !isNaN(rowCompareAtPrice) &&
            rowCompareAtPrice > 0
              ? rowCompareAtPrice
              : defaults?.compareAtPrice;
          const inventory =
            rowInventory !== null && !isNaN(rowInventory) && rowInventory >= 0
              ? rowInventory
              : defaults?.inventory;

          // Create product with variants
          const result = await this.createProductWithVariants(
            row.title,
            row.description,
            row.metatitle,
            row.metadescription,
            row.variantoption,
            row.folderpath,
            variantData,
            marketplace,
            {
              price,
              compareAtPrice,
              inventory,
              tags: row.tags || defaults?.tags || "",
              features: row.features || defaults?.features || "",
            }
          );

          results.push({
            success: true,
            productTitle: row.title,
            variantsCreated: variantData.length,
            data: result,
          });

          this.logger.log(
            `✓ Successfully created product with ${variantData.length} variants: ${row.title}`
          );
        } catch (error) {
          this.logger.error(
            `✗ Failed to create product ${row.title}:`,
            error.message
          );
          results.push({
            success: false,
            productTitle: row.title,
            variantsCreated: 0,
            error: error.message || "Unknown error",
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error("Bulk upload with variants failed:", error.message);
      throw error;
    }
  }

  /**
   * Get images for each variant from a flat folder structure
   * Looks for images named after variants (e.g., metal.jpg, glass.jpg)
   * or with pattern: variantName-1.jpg, variantName-2.jpg, etc.
   */
  private async getVariantImagesFromFolders(
    folderPath: string,
    variantNames: string[]
  ): Promise<Array<{ name: string; images: ImageFile[] }>> {
    const variantData: Array<{ name: string; images: ImageFile[] }> = [];

    try {
      // Check if folder exists
      const stats = await stat(folderPath);
      if (!stats.isDirectory()) {
        this.logger.error(`Folder path is not a directory: ${folderPath}`);
        return [];
      }

      // Get all files from the folder
      const allFiles = await readdir(folderPath);
      const allImages = new Map<string, ImageFile>();

      // Load all image files into memory
      for (const file of allFiles) {
        const filePath = path.join(folderPath, file);
        const fileStat = await stat(filePath);

        if (fileStat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
            const buffer = await readFile(filePath);
            allImages.set(file, {
              buffer,
              originalname: file,
              mimetype: `image/${ext.substring(1)}`,
              size: buffer.length,
            });
          }
        }
      }

      // For each variant, find matching images
      for (const variantName of variantNames) {
        const variantImages: ImageFile[] = [];
        const normalizedVariantName = variantName
          .toLowerCase()
          .replace(/\s+/g, "-");

        // Look for images matching patterns:
        // 1. Exact match: metal.jpg, glass.jpg
        // 2. With index: metal-1.jpg, metal-2.jpg
        // 3. Pattern: metal_1.jpg, metal_2.jpg
        for (const [filename, imageFile] of allImages.entries()) {
          const fileNameLower = filename.toLowerCase();
          const fileNameWithoutExt = fileNameLower.replace(/\.[^.]+$/, "");

          // Check if filename matches variant name
          if (
            fileNameWithoutExt === normalizedVariantName ||
            fileNameWithoutExt.startsWith(normalizedVariantName + "-") ||
            fileNameWithoutExt.startsWith(normalizedVariantName + "_")
          ) {
            variantImages.push(imageFile);
            this.logger.log(`Matched ${filename} to variant: ${variantName}`);
          }
        }

        // Always add variant even if no images found
        variantData.push({
          name: variantName,
          images: variantImages,
        });

        if (variantImages.length > 0) {
          this.logger.log(
            `✓ Found ${variantImages.length} images for variant: ${variantName}`
          );
        } else {
          this.logger.warn(
            `⚠ No images found for variant: ${variantName} (looked for: ${normalizedVariantName}*.jpg/png) - variant will be created without images`
          );
        }
      }

      return variantData;
    } catch (error) {
      this.logger.error(`Error reading folder ${folderPath}:`, error.message);
      throw new Error(`Could not read images from folder: ${folderPath}`);
    }
  }

  /**
   * Get all images from a folder
   */
  private async getImagesFromFolder(folderPath: string): Promise<ImageFile[]> {
    try {
      const files = await readdir(folderPath);
      const imageFiles: ImageFile[] = [];

      for (const file of files) {
        const filePath = path.join(folderPath, file);
        const fileStat = await stat(filePath);

        if (fileStat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
            const buffer = await readFile(filePath);
            imageFiles.push({
              buffer,
              originalname: file,
              mimetype: `image/${ext.substring(1)}`,
              size: buffer.length,
            });
          }
        }
      }

      return imageFiles;
    } catch (error) {
      this.logger.error(`Error reading folder ${folderPath}:`, error.message);
      throw new Error(`Could not read images from folder: ${folderPath}`);
    }
  }

  /**
   * Get general product images (images that don't match any variant name)
   */
  private async getGeneralProductImages(
    folderPath: string,
    variantNames: string[]
  ): Promise<ImageFile[]> {
    try {
      const files = await readdir(folderPath);
      const generalImages: ImageFile[] = [];

      // Normalize variant names for comparison
      const normalizedVariantNames = variantNames.map((name) =>
        name.toLowerCase().replace(/\s+/g, "-")
      );

      for (const file of files) {
        const filePath = path.join(folderPath, file);
        const fileStat = await stat(filePath);

        if (fileStat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
            const fileNameLower = file.toLowerCase();
            const fileNameWithoutExt = fileNameLower.replace(/\.[^.]+$/, "");

            // Check if this image matches any variant name
            const matchesVariant = normalizedVariantNames.some(
              (variantName) =>
                fileNameWithoutExt === variantName ||
                fileNameWithoutExt.startsWith(variantName + "-") ||
                fileNameWithoutExt.startsWith(variantName + "_")
            );

            // If it doesn't match any variant, it's a general product image
            if (!matchesVariant) {
              const buffer = await readFile(filePath);
              generalImages.push({
                buffer,
                originalname: file,
                mimetype: `image/${ext.substring(1)}`,
                size: buffer.length,
              });
              this.logger.log(`Found general product image: ${file}`);
            }
          }
        }
      }

      return generalImages;
    } catch (error) {
      this.logger.error(
        `Error reading general images from ${folderPath}:`,
        error.message
      );
      return [];
    }
  }

  /**
   * Upload general product images (not variant-specific)
   */
  private async uploadGeneralProductImages(
    productId: string,
    images: ImageFile[],
    productTitle: string
  ): Promise<void> {
    this.logger.log(`Uploading ${images.length} general product images...`);

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imageIndex = i + 1;
      try {
        this.logger.log(`Processing general image: ${image.originalname}`);

        // Step 1: Stage the upload
        const stagedTarget = await this.createStagedUpload(image);
        this.logger.log(`✓ Staged general image: ${image.originalname}`);

        // Step 2: Upload to staged URL
        await this.uploadToStagedUrl(stagedTarget, image);
        this.logger.log(`✓ Uploaded general image to staged URL`);

        // Step 3: Create media and attach to product (no variant ID)
        const altText = `${productTitle} (${imageIndex})`;
        const media = await this.createProductMedia(
          productId,
          stagedTarget.resourceUrl,
          undefined, // No variant ID for general images
          altText
        );

        this.logger.log(
          `✓ Uploaded general product image: ${image.originalname} with media ID: ${media?.id}`
        );
      } catch (error) {
        this.logger.error(
          `✗ Failed to upload general image ${image.originalname}:`,
          error.message
        );
        this.logger.error(`Error stack:`, error.stack);
      }
    }
  }

  /**
   * Create product with variants on Shopify
   */
  private async createProductWithVariants(
    title: string,
    description: string,
    metaTitle: string,
    metaDescription: string,
    variantOption: string,
    folderPath: string,
    variantData: Array<{ name: string; images: ImageFile[] }>,
    marketplace: string,
    options: {
      price?: number;
      compareAtPrice?: number;
      inventory?: number;
      tags?: string;
      features?: string;
    }
  ): Promise<any> {
    if (marketplace.toLowerCase() !== "shopify") {
      throw new Error(
        `Marketplace ${marketplace} is not yet supported for variant uploads`
      );
    }

    // Step 1: Create the base product with a temporary dummy variant
    const publicationIds = await (
      this.shopifyService as any
    ).getAllPublications();

    // Use a temporary dummy variant value to establish the product structure
    const dummyVariantValue = "_temp_variant_";

    const product = await this.createBasicProduct(
      title,
      description,
      metaTitle,
      metaDescription,
      variantOption,
      dummyVariantValue,
      options.tags,
      options.features,
      publicationIds
    );

    const productId = product.id;
    this.logger.log(
      `Product created with ID: ${productId} with temporary dummy variant`
    );

    // Get the auto-created dummy variant ID
    const dummyVariantId = product.variants.edges[0].node.id;

    // Use provided inventory or default to 20
    const inventory =
      options.inventory !== undefined && options.inventory !== null
        ? options.inventory
        : 20;
    const locationId = await (
      this.shopifyService as any
    ).getPrimaryLocationId();

    // Step 2: Create ALL real variants using productVariantsBulkCreate with pricing
    const allVariantNames = variantData.map((v) => v.name);
    this.logger.log(
      `Creating ${allVariantNames.length} real variants with pricing: ${allVariantNames.join(", ")}`
    );

    const allVariants = await this.createVariantsBulk(
      productId,
      variantOption,
      allVariantNames,
      options.price,
      options.compareAtPrice,
      inventory,
      locationId
    );

    this.logger.log(
      `✓ Created ${allVariants.length} variants with productVariantsBulkCreate`
    );

    // Step 3: Delete the temporary dummy variant
    this.logger.log(`Deleting temporary dummy variant...`);
    await this.deleteVariant(productId, dummyVariantId);
    this.logger.log(`✓ Deleted temporary dummy variant`);

    this.logger.log(
      `Total ${allVariants.length} variants created with price: ${options.price}, compareAt: ${options.compareAtPrice}, inventory: ${inventory}`
    );

    const variants = allVariants;

    // Step 3: Upload general product images and variant-specific images
    this.logger.log(
      `Starting image upload for ${variantData.length} variants...`
    );

    // First, upload general product images (images that don't match any variant)
    const generalImages = await this.getGeneralProductImages(
      folderPath,
      variantData.map((v) => v.name)
    );

    if (generalImages.length > 0) {
      this.logger.log(
        `Found ${generalImages.length} general product images to upload`
      );
      await this.uploadGeneralProductImages(productId, generalImages, title);
    }

    // Then upload variant-specific images
    const mediaResults = await this.uploadVariantImages(
      productId,
      variantData,
      variants,
      title
    );

    this.logger.log(
      `Completed image upload. Total media uploaded: ${mediaResults.reduce((sum, r) => sum + r.mediaCount, 0)}`
    );

    return {
      product,
      variants,
      media: mediaResults,
      totalVariants: variants.length,
    };
  }

  /**
   * Create basic product with productOption defined using first variant value
   */
  private async createBasicProduct(
    title: string,
    description: string,
    metaTitle: string,
    metaDescription: string,
    variantOption: string,
    firstVariantValue: string,
    tags?: string,
    features?: string,
    publicationIds?: string[]
  ): Promise<any> {
    const tagsArray = tags
      ? tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [];

    let featuresRichText = "";
    if (features) {
      const featureLines = features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f);
      console.log("FEATURE LINES:", featureLines);
      const listItems = featureLines.map((feature) => ({
        type: "list-item",
        children: [{ type: "text", value: feature }],
      }));

      featuresRichText = JSON.stringify({
        type: "root",
        children: [
          {
            type: "list",
            listType: "unordered",
            children: listItems,
          },
        ],
      });
    }

    const mutation = `
      mutation createProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            description
            status
            seo {
              title
              description
            }
            options {
              id
              name
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables: any = {
      input: {
        title,
        descriptionHtml: description,
        status: "ACTIVE",
        tags: tagsArray,
        productOptions: [
          {
            name: variantOption,
            values: [{ name: firstVariantValue }],
          },
        ],
      },
    };

    if (metaTitle || metaDescription) {
      variables.input.seo = {};
      if (metaTitle) variables.input.seo.title = metaTitle;
      if (metaDescription) variables.input.seo.description = metaDescription;
    }

    if (publicationIds && publicationIds.length > 0) {
      variables.input.publications = publicationIds.map((id) => ({
        publicationId: id,
      }));
    }

    if (featuresRichText) {
      variables.input.metafields = [
        {
          namespace: "custom",
          key: "new_custom_description",
          value: featuresRichText,
          type: "rich_text_field",
        },
        {
          namespace: "custom",
          key: "product_note",
          value: "Choose Your Model Inside",
          type: "single_line_text_field",
        },
      ];
    }

    const response = await this.shopifyService.executeGraphQL(
      mutation,
      variables
    );

    if (response.productCreate.userErrors.length > 0) {
      throw new Error(
        `Failed to create product: ${JSON.stringify(response.productCreate.userErrors)}`
      );
    }

    return response.productCreate.product;
  }

  /**
   * Delete a variant using productVariantsBulkDelete
   */
  private async deleteVariant(
    productId: string,
    variantId: string
  ): Promise<void> {
    const mutation = `
      mutation productVariantsBulkDelete($productId: ID!, $variantsIds: [ID!]!) {
        productVariantsBulkDelete(productId: $productId, variantsIds: $variantsIds) {
          product {
            id
            title
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      productId,
      variantsIds: [variantId],
    };

    const response = await this.shopifyService.executeGraphQL(
      mutation,
      variables
    );

    if (response.productVariantsBulkDelete.userErrors.length > 0) {
      this.logger.error(
        `Failed to delete variant: ${JSON.stringify(response.productVariantsBulkDelete.userErrors)}`
      );
      throw new Error(
        `Failed to delete variant: ${JSON.stringify(response.productVariantsBulkDelete.userErrors)}`
      );
    } else {
      this.logger.log(`✓ Deleted variant successfully`);
    }
  }

  /**
   * Create variants using productVariantsBulkCreate
   */
  private async createVariantsBulk(
    productId: string,
    variantOption: string,
    variantValues: string[],
    price?: number,
    compareAtPrice?: number,
    inventory?: number,
    locationId?: string
  ): Promise<any[]> {
    const mutation = `
      mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkCreate(productId: $productId, variants: $variants) {
          userErrors {
            field
            message
          }
          product {
            id
            options {
              id
              name
              values
              position
              optionValues {
                id
                name
                hasVariants
              }
            }
          }
          productVariants {
            id
            title
            selectedOptions {
              name
              value
            }
            price
            compareAtPrice
            inventoryQuantity
          }
        }
      }
    `;

    // Build variants input
    const variantsInput = variantValues.map((variantValue) => {
      const input: any = {
        optionValues: [
          {
            name: variantValue,
            optionName: variantOption,
          },
        ],
      };

      // Set price if provided (must be a valid positive number)
      if (
        price !== undefined &&
        price !== null &&
        !isNaN(price) &&
        price >= 0
      ) {
        input.price = price.toString();
      }

      // Set compareAtPrice if provided (must be a valid positive number)
      if (
        compareAtPrice !== undefined &&
        compareAtPrice !== null &&
        !isNaN(compareAtPrice) &&
        compareAtPrice >= 0
      ) {
        input.compareAtPrice = compareAtPrice.toString();
      }

      // Set inventory if provided (must be a valid non-negative number)
      if (
        inventory !== undefined &&
        inventory !== null &&
        !isNaN(inventory) &&
        inventory >= 0 &&
        locationId
      ) {
        input.inventoryQuantities = [
          {
            availableQuantity: inventory,
            locationId: locationId,
          },
        ];
      }

      return input;
    });

    const variables = {
      productId,
      variants: variantsInput,
    };

    this.logger.log(
      `Creating ${variantsInput.length} variants with productVariantsBulkCreate...`
    );

    const response = await this.shopifyService.executeGraphQL(
      mutation,
      variables
    );

    if (response.productVariantsBulkCreate.userErrors.length > 0) {
      throw new Error(
        `Failed to create variants: ${JSON.stringify(response.productVariantsBulkCreate.userErrors)}`
      );
    }

    this.logger.log(
      `Successfully created ${response.productVariantsBulkCreate.productVariants.length} variants`
    );

    return response.productVariantsBulkCreate.productVariants;
  }

  /**
   * Update variants with pricing and inventory using bulk update (DEPRECATED - use createVariantsBulk instead)
   */
  private async updateVariantsPricing(
    productId: string,
    variants: any[],
    price?: number,
    compareAtPrice?: number,
    inventory?: number,
    locationId?: string
  ): Promise<void> {
    const mutation = `
      mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants {
            id
            price
            compareAtPrice
            inventoryQuantity
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variantsInput = variants.map((variant) => {
      const input: any = {
        id: variant.id,
      };

      // Set price if provided (must be a valid positive number)
      if (
        price !== undefined &&
        price !== null &&
        !isNaN(price) &&
        price >= 0
      ) {
        input.price = price.toString();
      }

      // Set compareAtPrice if provided (must be a valid positive number)
      if (
        compareAtPrice !== undefined &&
        compareAtPrice !== null &&
        !isNaN(compareAtPrice) &&
        compareAtPrice >= 0
      ) {
        input.compareAtPrice = compareAtPrice.toString();
      }

      // Set inventory if provided (must be a valid non-negative number)
      if (
        inventory !== undefined &&
        inventory !== null &&
        !isNaN(inventory) &&
        inventory >= 0 &&
        locationId
      ) {
        input.inventoryQuantities = [
          {
            availableQuantity: inventory,
            locationId: locationId,
          },
        ];
      }

      return input;
    });

    const variables = {
      productId: productId,
      variants: variantsInput,
    };

    const response = await this.shopifyService.executeGraphQL(
      mutation,
      variables
    );

    if (response.productVariantsBulkUpdate.userErrors.length > 0) {
      this.logger.warn(
        `Warning updating variants: ${JSON.stringify(response.productVariantsBulkUpdate.userErrors)}`
      );
    } else {
      this.logger.log(`Updated pricing for ${variants.length} variants`);
    }
  }

  /**
   * Upload images for each variant
   */
  private async uploadVariantImages(
    productId: string,
    variantData: Array<{ name: string; images: ImageFile[] }>,
    variants: any[],
    productTitle: string
  ): Promise<any[]> {
    const allMediaResults = [];

    this.logger.log(
      `Found ${variantData.length} variants with images to upload`
    );

    for (let i = 0; i < variantData.length; i++) {
      const { name, images } = variantData[i];

      this.logger.log(
        `Processing variant "${name}" with ${images.length} images`
      );

      const variant = variants.find((v) =>
        v.selectedOptions.some((opt: any) => opt.value === name)
      );

      if (!variant) {
        this.logger.warn(`Could not find variant for: ${name}`);
        this.logger.warn(
          `Available variants: ${variants.map((v) => v.selectedOptions.map((o: any) => o.value).join("/")).join(", ")}`
        );
        continue;
      }

      if (images.length === 0) {
        this.logger.warn(`No images found for variant: ${name}`);
        continue;
      }

      this.logger.log(
        `Uploading ${images.length} images for variant: ${name} (ID: ${variant.id})`
      );

      // Upload images and associate with variant
      const mediaResults = await this.uploadAndAttachMediaToVariant(
        productId,
        variant.id,
        images,
        productTitle,
        name
      );

      allMediaResults.push({
        variantName: name,
        variantId: variant.id,
        mediaCount: mediaResults.length,
        media: mediaResults,
      });

      this.logger.log(
        `✓ Successfully uploaded ${mediaResults.length} images for variant: ${name}`
      );
    }

    return allMediaResults;
  }

  /**
   * Upload and attach media to a specific variant
   */
  private async uploadAndAttachMediaToVariant(
    productId: string,
    variantId: string,
    images: ImageFile[],
    productTitle: string,
    variantName: string
  ): Promise<any[]> {
    const mediaResults = [];

    this.logger.log(
      `Starting upload of ${images.length} images for variant ${variantId}`
    );

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imageIndex = i + 1;
      try {
        this.logger.log(
          `Processing image: ${image.originalname} (${image.size} bytes)`
        );

        // Step 1: Stage the upload
        this.logger.log(`Step 1: Staging upload for ${image.originalname}...`);
        const stagedTarget = await this.createStagedUpload(image);
        this.logger.log(
          `✓ Staged upload created. Resource URL: ${stagedTarget.resourceUrl}`
        );

        // Step 2: Upload to staged URL
        this.logger.log(`Step 2: Uploading to staged URL...`);
        await this.uploadToStagedUrl(stagedTarget, image);
        this.logger.log(`✓ Uploaded to staged URL`);

        // Step 3: Create media and attach to product/variant
        this.logger.log(
          `Step 3: Creating product media and attaching to variant...`
        );
        const altText = `${productTitle} - ${variantName} (${imageIndex})`;
        const media = await this.createProductMedia(
          productId,
          stagedTarget.resourceUrl,
          variantId,
          altText
        );
        this.logger.log(
          `✓ Media created with ID: ${media?.id}, Status: ${media?.status}`
        );

        mediaResults.push(media);
        this.logger.log(
          `✓ Successfully uploaded and attached image: ${image.originalname}`
        );
      } catch (error) {
        this.logger.error(
          `✗ Failed to upload image ${image.originalname}:`,
          error.message
        );
        this.logger.error(`Error stack:`, error.stack);
      }
    }

    this.logger.log(
      `Completed upload. ${mediaResults.length}/${images.length} images uploaded successfully`
    );
    return mediaResults;
  }

  /**
   * Create staged upload
   */
  private async createStagedUpload(image: ImageFile): Promise<any> {
    // Use the ShopifyService's generateStagedUpload method with the correct structure
    const fileObject: Express.Multer.File = {
      buffer: image.buffer,
      originalname: image.originalname,
      mimetype: image.mimetype,
      size: image.size,
      fieldname: "file",
      encoding: "7bit",
      destination: "",
      filename: image.originalname,
      path: "",
      stream: null,
    };

    return (this.shopifyService as any).generateStagedUpload(fileObject);
  }

  /**
   * Upload to staged URL
   */
  private async uploadToStagedUrl(
    stagedTarget: any,
    image: ImageFile
  ): Promise<void> {
    // Use the ShopifyService's uploadFileToStaged method
    const fileObject: Express.Multer.File = {
      buffer: image.buffer,
      originalname: image.originalname,
      mimetype: image.mimetype,
      size: image.size,
      fieldname: "file",
      encoding: "7bit",
      destination: "",
      filename: image.originalname,
      path: "",
      stream: null,
    };

    return (this.shopifyService as any).uploadFileToStaged(
      stagedTarget,
      fileObject
    );
  }

  /**
   * Create product media and attach to variant
   */
  private async createProductMedia(
    productId: string,
    resourceUrl: string,
    variantId?: string,
    altText?: string
  ): Promise<any> {
    this.logger.log(
      `Creating media for product ${productId}, resourceUrl: ${resourceUrl}, variantId: ${variantId || "none"}, altText: ${altText || "none"}`
    );

    const mutation = `
      mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
        productCreateMedia(productId: $productId, media: $media) {
          media {
            ... on MediaImage {
              id
              image {
                url
              }
              status
            }
          }
          mediaUserErrors {
            field
            message
          }
        }
      }
    `;

    const mediaInput: any = {
      originalSource: resourceUrl,
      mediaContentType: "IMAGE",
    };

    // Add alt text if provided
    if (altText) {
      mediaInput.alt = altText;
    }

    const variables = {
      productId,
      media: [mediaInput],
    };

    this.logger.log(
      `Executing productCreateMedia mutation with variables: ${JSON.stringify(variables)}`
    );
    const response = await this.shopifyService.executeGraphQL(
      mutation,
      variables
    );

    if (response.productCreateMedia.mediaUserErrors.length > 0) {
      this.logger.error(
        `Media creation errors: ${JSON.stringify(response.productCreateMedia.mediaUserErrors)}`
      );
      throw new Error(
        `Failed to create media: ${JSON.stringify(response.productCreateMedia.mediaUserErrors)}`
      );
    }

    const createdMedia = response.productCreateMedia.media[0];
    this.logger.log(
      `✓ Media created successfully: ${JSON.stringify(createdMedia)}`
    );

    // If we have a variant, wait for media to be READY then attach it
    if (variantId && createdMedia) {
      this.logger.log(
        `Waiting for media ${createdMedia.id} to be READY before attaching to variant ${variantId}...`
      );

      const isReady = await this.waitForMediaReady(productId, createdMedia.id);

      if (isReady) {
        this.logger.log(
          `Attaching media ${createdMedia.id} to variant ${variantId}...`
        );
        await this.attachMediaToVariant(productId, variantId, createdMedia.id);
        this.logger.log(`✓ Media attached to variant successfully`);
      } else {
        this.logger.error(
          `✗ Media ${createdMedia.id} not ready, skipping variant attachment`
        );
        throw new Error(`Media ${createdMedia.id} did not reach READY status`);
      }
    }

    return createdMedia;
  }

  /**
   * Wait for media to be READY before attaching to variant
   */
  private async waitForMediaReady(
    productId: string,
    mediaId: string,
    maxAttempts: number = 30,
    delayMs: number = 2000
  ): Promise<boolean> {
    this.logger.log(`Waiting for media ${mediaId} to be READY...`);

    const query = `
      query getProduct($id: ID!) {
        product(id: $id) {
          media(first: 100) {
            nodes {
              ... on MediaImage {
                id
                status
                preview {
                  status
                }
              }
            }
          }
        }
      }
    `;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.shopifyService.executeGraphQL(query, {
          id: productId,
        });

        const media = response.product?.media?.nodes?.find(
          (m: any) => m.id === mediaId
        );

        if (media) {
          this.logger.log(
            `Media ${mediaId} status: ${media.status}, preview status: ${media.preview?.status} (attempt ${attempt}/${maxAttempts})`
          );

          // Check if media is READY
          if (media.status === "READY" || media.preview?.status === "READY") {
            this.logger.log(`✓ Media ${mediaId} is READY`);
            return true;
          }
        } else {
          this.logger.warn(
            `Media ${mediaId} not found in product media (attempt ${attempt}/${maxAttempts})`
          );
        }

        // Wait before next attempt
        if (attempt < maxAttempts) {
          this.logger.log(`Waiting ${delayMs}ms before next check...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        this.logger.error(
          `Error checking media status (attempt ${attempt}/${maxAttempts}):`,
          error.message
        );
      }
    }

    this.logger.error(
      `Media ${mediaId} did not reach READY status after ${maxAttempts} attempts`
    );
    return false;
  }

  /**
   * Attach media to variant
   */
  private async attachMediaToVariant(
    productId: string,
    variantId: string,
    mediaId: string
  ): Promise<void> {
    this.logger.log(
      `Attaching media ${mediaId} to variant ${variantId} for product ${productId}`
    );

    const mutation = `
      mutation productVariantAppendMedia($productId: ID!, $variantMedia: [ProductVariantAppendMediaInput!]!) {
        productVariantAppendMedia(productId: $productId, variantMedia: $variantMedia) {
          productVariants {
            id
            media(first: 10) {
              nodes {
                id
              }
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
      productId,
      variantMedia: [
        {
          variantId,
          mediaIds: [mediaId],
        },
      ],
    };

    this.logger.log(
      `Executing productVariantAppendMedia with variables: ${JSON.stringify(variables)}`
    );
    const response = await this.shopifyService.executeGraphQL(
      mutation,
      variables
    );

    if (response.productVariantAppendMedia.userErrors.length > 0) {
      this.logger.error(
        `Error attaching media to variant: ${JSON.stringify(response.productVariantAppendMedia.userErrors)}`
      );
      throw new Error(
        `Failed to attach media to variant: ${JSON.stringify(response.productVariantAppendMedia.userErrors)}`
      );
    }

    this.logger.log(
      `✓ Media successfully attached. Variant now has ${response.productVariantAppendMedia.productVariants[0]?.media?.nodes?.length || 0} media items`
    );
  }

  /**
   * Parse CSV file
   */
  private async parseCSV(csvContent: string): Promise<CSVRowVariant[]> {
    // Parse CSV respecting quoted fields with newlines
    const lines = this.splitCSVIntoRows(csvContent);

    if (lines.length < 2) {
      throw new Error("CSV file is empty or missing header row");
    }

    const headers = this.parseCSVLine(lines[0]);
    const rows: CSVRowVariant[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);

      if (values.length === 0) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        const normalizedHeader = header
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[^a-z0-9]/g, "");
        row[normalizedHeader] = values[index] || "";
      });

      if (!row.title || row.title.trim() === "") {
        continue;
      }

      rows.push(row as CSVRowVariant);
    }

    return rows;
  }

  /**
   * Split CSV content into rows while respecting quoted fields with newlines
   */
  private splitCSVIntoRows(csvContent: string): string[] {
    const rows: string[] = [];
    let currentRow = "";
    let inQuotes = false;

    for (let i = 0; i < csvContent.length; i++) {
      const char = csvContent[i];
      const nextChar = csvContent[i + 1];

      if (char === '"') {
        currentRow += char;
        // Handle escaped quotes (double quotes)
        if (inQuotes && nextChar === '"') {
          currentRow += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        // End of row - only if not inside quotes
        if (currentRow.trim() !== '') {
          rows.push(currentRow);
          currentRow = "";
        }
        // Skip \r\n sequence
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentRow += char;
      }
    }

    // Add the last row if not empty
    if (currentRow.trim() !== '') {
      rows.push(currentRow);
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
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }
}

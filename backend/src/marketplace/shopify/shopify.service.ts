import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import * as FormData from "form-data";

interface StagedUploadTarget {
  url: string;
  resourceUrl: string;
  parameters: Array<{ name: string; value: string }>;
}

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);
  private readonly shopifyUrl: string;
  private readonly accessToken: string;
  private readonly apiVersion: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.shopifyUrl = this.configService.get<string>("SHOPIFY_STORE_URL");
    this.accessToken = this.configService.get<string>("SHOPIFY_ACCESS_TOKEN");
    this.apiVersion =
      this.configService.get<string>("SHOPIFY_API_VERSION") || "2024-01";
  }

  /**
   * Main method to create a product with media on Shopify
   */
  async createProductWithMedia(
    title: string,
    description: string,
    images?: Express.Multer.File[]
  ) {
    this.logger.log(`Creating product: ${title}`);

    try {
      // Step 1: Create the product first
      const product = await this.createProduct(title, description);
      const productId = product.id;

      this.logger.log(`Product created with ID: ${productId}`);

      // Step 2: If images are provided, upload and attach them
      if (images && images.length > 0) {
        this.logger.log(`Uploading ${images.length} images...`);
        const mediaResults = await this.uploadAndAttachMedia(productId, images);

        return {
          product,
          media: mediaResults,
          totalImages: images.length,
        };
      }

      return {
        product,
        media: [],
        totalImages: 0,
      };
    } catch (error) {
      this.logger.error("Error creating product with media:", error);
      throw error;
    }
  }

  /**
   * Step 1: Create a basic product without media
   */
  private async createProduct(title: string, description: string) {
    const mutation = `
      mutation createProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            description
            status
            createdAt
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
        title,
        descriptionHtml: description,
        status: "ACTIVE",
      },
    };

    const response = await this.graphqlRequest(mutation, variables);

    if (response.productCreate.userErrors.length > 0) {
      throw new Error(
        `Failed to create product: ${JSON.stringify(response.productCreate.userErrors)}`
      );
    }

    return response.productCreate.product;
  }

  /**
   * Step 2: Upload media and attach to product
   */
  private async uploadAndAttachMedia(
    productId: string,
    images: Express.Multer.File[]
  ) {
    const results = [];

    for (const image of images) {
      try {
        // Step 2.1: Generate staged upload URL
        const stagedTarget = await this.generateStagedUpload(image);

        // Step 2.2: Upload the file to the staged URL
        await this.uploadFileToStaged(stagedTarget, image);

        // Step 2.3: Attach the media to the product
        const media = await this.attachMediaToProduct(
          productId,
          stagedTarget.resourceUrl,
          image.originalname
        );

        results.push({
          filename: image.originalname,
          status: "success",
          media,
        });

        this.logger.log(`Successfully uploaded: ${image.originalname}`);
      } catch (error) {
        this.logger.error(`Failed to upload ${image.originalname}:`, error);
        results.push({
          filename: image.originalname,
          status: "failed",
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Step 2.1: Generate staged upload parameters
   */
  private async generateStagedUpload(
    file: Express.Multer.File
  ): Promise<StagedUploadTarget> {
    const mutation = `
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
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
      input: [
        {
          filename: file.originalname,
          mimeType: file.mimetype,
          resource: "IMAGE",
          httpMethod: "POST",
          fileSize: file.size.toString(),
        },
      ],
    };

    const response = await this.graphqlRequest(mutation, variables);

    if (response.stagedUploadsCreate.userErrors.length > 0) {
      throw new Error(
        `Failed to generate staged upload: ${JSON.stringify(response.stagedUploadsCreate.userErrors)}`
      );
    }

    return response.stagedUploadsCreate.stagedTargets[0];
  }

  /**
   * Step 2.2: Upload file to staged URL
   */
  private async uploadFileToStaged(
    stagedTarget: StagedUploadTarget,
    file: Express.Multer.File
  ) {
    const formData = new FormData();

    // Add all parameters from Shopify
    stagedTarget.parameters.forEach((param) => {
      formData.append(param.name, param.value);
    });

    // Add the file last
    formData.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    try {
      await firstValueFrom(
        this.httpService.post(stagedTarget.url, formData, {
          headers: {
            ...formData.getHeaders(),
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        })
      );
    } catch (error) {
      this.logger.error(
        "Upload to staged URL failed:",
        error.response?.data || error.message
      );
      throw new Error(`Failed to upload to staged URL: ${error.message}`);
    }
  }

  /**
   * Step 2.3: Attach media to product
   */
  private async attachMediaToProduct(
    productId: string,
    resourceUrl: string,
    altText: string
  ) {
    const mutation = `
      mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
        productCreateMedia(productId: $productId, media: $media) {
          media {
            id
            alt
            mediaContentType
            status
            ... on MediaImage {
              id
              image {
                url
                altText
              }
            }
          }
          mediaUserErrors {
            field
            message
            code
          }
        }
      }
    `;

    const variables = {
      productId,
      media: [
        {
          originalSource: resourceUrl,
          alt: altText,
          mediaContentType: "IMAGE",
        },
      ],
    };

    const response = await this.graphqlRequest(mutation, variables);

    if (response.productCreateMedia.mediaUserErrors.length > 0) {
      throw new Error(
        `Failed to attach media: ${JSON.stringify(response.productCreateMedia.mediaUserErrors)}`
      );
    }

    return response.productCreateMedia.media[0];
  }

  /**
   * Helper method to make GraphQL requests to Shopify
   */
  private async graphqlRequest(query: string, variables: any = {}) {
    const url = `https://${this.shopifyUrl}/admin/api/${this.apiVersion}/graphql.json`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            query,
            variables,
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": this.accessToken,
            },
          }
        )
      );

      if (response.data.errors) {
        throw new Error(
          `GraphQL errors: ${JSON.stringify(response.data.errors)}`
        );
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(
        "GraphQL request failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Retrieve product with media
   */
  async getProductWithMedia(productId: string) {
    const query = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          description
          status
          media(first: 10) {
            edges {
              node {
                alt
                mediaContentType
                status
                ... on MediaImage {
                  id
                  image {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
    `;

    const variables = { id: productId };
    const response = await this.graphqlRequest(query, variables);
    return response.product;
  }
}

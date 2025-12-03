# Backend - Marketplace Connector API

NestJS backend service for managing products across multiple marketplaces.

## 🏗️ Architecture

### Modules

#### Product Module (`src/product/`)
Central module for product management that delegates to marketplace-specific services.

**Files:**
- `product.module.ts` - Module definition
- `product.controller.ts` - HTTP endpoints
- `product.service.ts` - Business logic orchestration
- `dto/create-product.dto.ts` - Data transfer objects and validation

#### Marketplace Module (`src/marketplace/`)
Contains marketplace-specific integrations.

**Services:**
- `shopify/shopify.service.ts` - Shopify GraphQL API integration
- `amazon/amazon.service.ts` - Amazon integration (placeholder)
- `meesho/meesho.service.ts` - Meesho integration (placeholder)

### Data Flow

```
Client Request
    ↓
ProductController (handles multipart/form-data)
    ↓
ProductService (routes to marketplace)
    ↓
MarketplaceService (Shopify/Amazon/Meesho)
    ↓
External API
```

## 🔌 Shopify Service Details

### Key Methods

#### `createProductWithMedia(title, description, images)`
Main entry point for creating products with media.

**Steps:**
1. Create base product
2. For each image:
   - Generate staged upload URL
   - Upload file to Google Cloud Storage
   - Attach media to product
3. Return combined results

#### `generateStagedUpload(file)`
Calls Shopify's `stagedUploadsCreate` mutation to get upload credentials.

**Parameters:**
- `filename` - Original filename
- `mimeType` - File MIME type
- `resource` - Always "IMAGE"
- `httpMethod` - "POST"
- `fileSize` - File size in bytes

#### `uploadFileToStaged(stagedTarget, file)`
Uploads file to Google Cloud Storage using multipart/form-data.

**Process:**
1. Create FormData with Shopify parameters
2. Append file buffer
3. POST to staged URL
4. Handle upload errors

#### `attachMediaToProduct(productId, resourceUrl, altText)`
Links uploaded media to product using `productCreateMedia` mutation.

### GraphQL Mutations Used

1. **productCreate** - Creates product
2. **stagedUploadsCreate** - Gets upload credentials
3. **productCreateMedia** - Attaches media to product

### Error Handling

- GraphQL errors are caught and logged
- User-friendly error messages returned
- Individual image upload failures don't stop the process
- Results array includes success/failure status for each image

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Shopify
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
SHOPIFY_API_VERSION=2024-01

# CORS
FRONTEND_URL=http://localhost:3000
```

### Required Shopify Scopes

- `read_products` - Read product data
- `write_products` - Create and modify products

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": { },
    "media": [ ],
    "totalImages": 2
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Failed to create product",
  "error": "Detailed error message"
}
```

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🔍 Debugging

Enable detailed logging:

```typescript
private readonly logger = new Logger(ShopifyService.name);
```

Logs include:
- Product creation start/completion
- Image upload progress
- GraphQL request/response
- Error details

## 🚀 Deployment

### Build
```bash
npm run build
```

### Start Production
```bash
npm run start:prod
```

### Environment Variables
Ensure all required environment variables are set in production environment.

## 📝 Adding New Marketplace

1. Create service in `src/marketplace/[marketplace]/`
2. Implement `createProduct(title, description, images)` method
3. Add to `MarketplaceModule` providers
4. Inject into `ProductService`
5. Add case in `ProductService.createProduct()` switch

Example:
```typescript
// src/marketplace/ebay/ebay.service.ts
@Injectable()
export class EbayService {
  async createProduct(title, description, images) {
    // Implementation
  }
}
```

## 🔒 Security

- Use environment variables for sensitive data
- Validate all inputs with class-validator
- Enable CORS only for trusted origins
- Use HTTPS in production
- Rotate API tokens regularly

## 📚 References

- [NestJS Documentation](https://docs.nestjs.com/)
- [Shopify GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql)
- [Shopify Product Media Guide](https://shopify.dev/docs/apps/build/online-store/product-media)

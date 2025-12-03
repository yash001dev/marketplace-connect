# Shopify Integration Guide

Complete guide for integrating with Shopify's GraphQL Admin API.

## 📋 Prerequisites

1. Shopify Partner account or store owner access
2. Custom app created in your store
3. Admin API access token
4. API scopes: `read_products` and `write_products`

## 🔧 Setup Steps

### 1. Create a Custom App

1. Log into your Shopify admin panel
2. Go to **Settings** → **Apps and sales channels**
3. Click **Develop apps**
4. Click **Create an app**
5. Enter app name (e.g., "Marketplace Connector")
6. Click **Create app**

### 2. Configure API Access

1. Click **Configure Admin API scopes**
2. Under **Products**, select:
   - ✅ `read_products` - View products
   - ✅ `write_products` - Create and update products
3. Click **Save**

### 3. Install App & Get Token

1. Click **Install app**
2. Copy the **Admin API access token** (starts with `shpat_`)
3. **Important**: Save this token securely - you won't see it again!

### 4. Get API Details

- **Store URL**: `your-store-name.myshopify.com`
- **API Version**: `2024-01` (or latest stable version)
- **GraphQL Endpoint**: `https://your-store.myshopify.com/admin/api/2024-01/graphql.json`

## 🔐 Authentication

All requests must include:

```http
POST /admin/api/2024-01/graphql.json
Content-Type: application/json
X-Shopify-Access-Token: shpat_xxxxxxxxxxxxx
```

## 📊 API Flow

### Complete Product Creation with Media

```
1. Create Product
   ↓
2. Generate Staged Upload URLs
   ↓
3. Upload Files to Staging
   ↓
4. Attach Media to Product
   ↓
5. Verify Media Status
```

## 🔍 GraphQL Operations

### 1. Create Product

Creates a basic product without media.

```graphql
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
```

**Variables:**
```json
{
  "input": {
    "title": "My Product",
    "descriptionHtml": "<p>Product description</p>",
    "status": "ACTIVE"
  }
}
```

### 2. Generate Staged Upload

Gets credentials for uploading media files.

```graphql
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
```

**Variables:**
```json
{
  "input": [
    {
      "filename": "product-image.jpg",
      "mimeType": "image/jpeg",
      "resource": "IMAGE",
      "httpMethod": "POST",
      "fileSize": "1024000"
    }
  ]
}
```

### 3. Attach Media to Product

Links uploaded media to a product.

```graphql
mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
  productCreateMedia(productId: $productId, media: $media) {
    media {
      id
      alt
      mediaContentType
      status
      ... on MediaImage {
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
```

**Variables:**
```json
{
  "productId": "gid://shopify/Product/123456",
  "media": [
    {
      "originalSource": "https://storage.googleapis.com/...",
      "alt": "Product image description",
      "mediaContentType": "IMAGE"
    }
  ]
}
```

### 4. Query Product with Media

Retrieves product including all media.

```graphql
query getProduct($id: ID!) {
  product(id: $id) {
    id
    title
    description
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
```

## 📸 Media Requirements

### Image Specifications

| Property | Requirement |
|----------|-------------|
| **File Size** | Max 20 MB |
| **Resolution** | Max 20 MP (megapixels) |
| **Dimensions** | Max 4472 x 4472 px |
| **Aspect Ratio** | Between 100:1 and 1:100 |
| **Formats** | JPEG, PNG, WEBP, HEIC, GIF |
| **Filenames** | Letters, numbers, spaces, symbols (not starting with `.`) |

### Recommended Dimensions
- Square images: 2048 x 2048 px
- Product images: 1024 x 1024 px minimum

## 🚀 Upload Process Details

### Step 1: Request Staged Upload URL

```typescript
const stagedUploadRequest = {
  filename: "image.jpg",
  mimeType: "image/jpeg",
  resource: "IMAGE",
  httpMethod: "POST",
  fileSize: "1048576" // in bytes
}
```

### Step 2: Upload to Google Cloud Storage

**Form Data Structure:**
```typescript
const formData = new FormData()

// Add all parameters from stagedTarget.parameters
formData.append('Content-Type', 'image/jpeg')
formData.append('key', 'tmp/...')
formData.append('policy', 'eyJjb25k...')
formData.append('x-goog-algorithm', 'GOOG4-RSA-SHA256')
formData.append('x-goog-credential', 'merchant-assets@...')
formData.append('x-goog-date', '20240101T120000Z')
formData.append('x-goog-signature', '5c27c9a...')

// File must be last
formData.append('file', fileBuffer, {
  filename: 'image.jpg',
  contentType: 'image/jpeg'
})
```

**Upload Request:**
```typescript
await axios.post(stagedTarget.url, formData, {
  headers: formData.getHeaders(),
  maxBodyLength: Infinity
})
```

### Step 3: Attach to Product

Use the `resourceUrl` from Step 1 response:

```typescript
const mediaInput = {
  originalSource: stagedTarget.resourceUrl,
  alt: "Product image",
  mediaContentType: "IMAGE"
}
```

## 🔄 Media Status

After attaching media, check the status:

```typescript
media.status
```

**Possible Values:**
- `UPLOADED` - Upload complete, processing pending
- `PROCESSING` - Shopify is processing the media
- `READY` - Media is ready to display
- `FAILED` - Processing failed

## ⚠️ Rate Limits

### GraphQL API Limits
- **Calculated Query Cost** - Each query has a cost
- **Default Bucket Size** - 1000 points
- **Restore Rate** - 50 points/second
- **Query Cost** - Varies by complexity

### Video Creation Limits
- **Maximum**: 1,000 video objects per week per store
- **Reset**: 7 days after first video creation
- **Error Code**: `VIDEO_THROTTLE_EXCEEDED`

### Storage Limits by Plan

| Plan | Videos & 3D Models | Total Storage |
|------|-------------------|---------------|
| **Basic** | 250 | 100 GB |
| **Shopify** | 1,000 | 300 GB |
| **Advanced** | 5,000 | 300 GB |
| **Plus** | Contact Support | 300 GB+ |

## 🐛 Common Errors

### Authentication Errors

**Invalid Access Token:**
```json
{
  "errors": [
    {
      "message": "Invalid API key or access token"
    }
  ]
}
```
✅ **Solution**: Verify your access token in `.env`

### Permission Errors

**Missing Scopes:**
```json
{
  "errors": [
    {
      "message": "Access denied for productCreate field"
    }
  ]
}
```
✅ **Solution**: Add `write_products` scope to your app

### Upload Errors

**Staged Upload Expired:**
```
Upload failed: 403 Forbidden
```
✅ **Solution**: Staged URLs expire - regenerate and retry

**File Too Large:**
```json
{
  "userErrors": [
    {
      "field": "fileSize",
      "message": "File size exceeds maximum"
    }
  ]
}
```
✅ **Solution**: Resize image to under 20MB

### Media Attachment Errors

**Invalid Resource URL:**
```json
{
  "mediaUserErrors": [
    {
      "code": "INVALID_RESOURCE_URL",
      "message": "Resource URL is invalid"
    }
  ]
}
```
✅ **Solution**: Use exact `resourceUrl` from staged upload response

## 📚 Additional Resources

- [Shopify GraphQL Admin API Reference](https://shopify.dev/docs/api/admin-graphql)
- [Product Media Guide](https://shopify.dev/docs/apps/build/online-store/product-media)
- [GraphQL Basics](https://shopify.dev/docs/api/usage/graphql)
- [API Versioning](https://shopify.dev/docs/api/usage/versioning)
- [Rate Limits](https://shopify.dev/docs/api/usage/rate-limits)

## 🧪 Testing

### Test with GraphiQL

1. Go to your app configuration
2. Click **API credentials**
3. Under **Admin API**, click **Explore with GraphiQL**
4. Test queries and mutations

### Example Test Query

```graphql
{
  shop {
    name
    myshopifyDomain
    plan {
      displayName
    }
  }
}
```

## 🔒 Security Best Practices

1. **Never commit** access tokens to version control
2. **Use environment variables** for all credentials
3. **Rotate tokens** regularly
4. **Limit scopes** to only what's needed
5. **Monitor API usage** in Shopify admin
6. **Use HTTPS** for all requests
7. **Validate file uploads** before processing

## 📊 Monitoring

Check your API usage:
1. Shopify Admin → Settings → Apps and sales channels
2. Your app → API credentials
3. View **API call limit**

---

**Last Updated**: December 2024
**API Version**: 2024-01

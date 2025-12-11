# Meta Title & Description Update Guide

This guide explains how to update SEO meta titles and descriptions for Shopify products and collections using CSV files.

## Overview

The meta update feature allows you to bulk update SEO metadata for:
- **Products**: Individual product pages
- **Collections**: Collection/category pages

This is useful for:
- SEO optimization
- Improving search engine rankings
- Updating page titles and descriptions in bulk

## CSV Format

Your CSV file must have exactly 3 columns:

| Column Name | Description | Required | Example |
|------------|-------------|----------|---------|
| Page URL | Full URL of the product or collection | Yes | `https://yourstore.myshopify.com/products/blue-t-shirt` |
| Meta Title | SEO title (55-60 characters recommended) | Yes | `Blue Cotton T-Shirt - Comfortable & Stylish` |
| Meta Description | SEO description (150-160 characters recommended) | Yes | `Comfortable blue t-shirt made from 100% premium cotton. Perfect for casual wear.` |

### Example CSV

```csv
Page URL,Meta Title,Meta Description
https://yourstore.myshopify.com/collections/summer-collection,Summer Collection 2024 - Premium Fashion,Browse our latest summer collection with fresh styles and premium quality fabrics.
https://yourstore.myshopify.com/products/blue-t-shirt,Blue Cotton T-Shirt - Comfortable & Stylish,Comfortable blue t-shirt made from 100% premium cotton. Perfect for casual wear.
```

## How It Works

1. **URL Parsing**: The system automatically detects whether the URL is for a product or collection
   - URLs containing `/products/` → Product update
   - URLs containing `/collections/` → Collection update

2. **Handle Extraction**: The product/collection handle is extracted from the URL
   - Example: `https://store.com/products/blue-t-shirt` → handle: `blue-t-shirt`

3. **ID Resolution**: The handle is used to lookup the Shopify product/collection ID

4. **Meta Update**: SEO fields are updated using Shopify Admin API GraphQL mutations

## Using the Feature

### Frontend (Web Interface)

1. Navigate to the **🏷️ Meta SEO** tab
2. Select your marketplace (Shopify, Amazon, Meesho)
3. Click **Download CSV Template** to get a sample file
4. Fill in your CSV with URLs and meta information
5. Drag and drop or click to upload your CSV file
6. Click **Update Meta Information**
7. View results showing success/failure for each URL

### Backend (API)

**Endpoint**: `POST /products/meta-update`

**Request**:
```
Content-Type: multipart/form-data

- csvFile: [CSV file upload]
- marketplace: "shopify"
```

**Response**:
```json
{
  "success": true,
  "totalProcessed": 4,
  "successCount": 4,
  "failedCount": 0,
  "results": [
    {
      "success": true,
      "url": "https://yourstore.myshopify.com/products/blue-t-shirt",
      "type": "product",
      "identifier": "blue-t-shirt",
      "data": {
        "id": "gid://shopify/Product/123",
        "handle": "blue-t-shirt",
        "title": "Blue T-Shirt",
        "seo": {
          "title": "Blue Cotton T-Shirt - Comfortable & Stylish",
          "description": "Comfortable blue t-shirt..."
        }
      }
    }
  ],
  "message": "Meta update completed. 4 succeeded, 0 failed."
}
```

## Best Practices

### SEO Guidelines

1. **Meta Title**:
   - Keep it between 55-60 characters
   - Include primary keyword near the beginning
   - Make it compelling and clickable
   - Include brand name at the end (optional)

2. **Meta Description**:
   - Keep it between 150-160 characters
   - Include call-to-action
   - Use relevant keywords naturally
   - Provide clear value proposition

### URL Format

- Use full URLs including `https://`
- Ensure URLs are valid and accessible
- Use the actual Shopify store domain
- Check that products/collections exist before updating

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Product not found with handle: ..." | Product doesn't exist | Verify the product URL is correct |
| "Collection not found with handle: ..." | Collection doesn't exist | Verify the collection URL is correct |
| "Invalid URL format" | URL doesn't contain /products/ or /collections/ | Check URL structure |
| "Missing required fields" | CSV row missing data | Ensure all 3 columns have values |
| "Marketplace not supported" | Non-Shopify marketplace selected | Currently only Shopify is supported |

## Technical Details

### Shopify GraphQL Mutations

**Product Update**:
```graphql
mutation productUpdate($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      handle
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
```

**Collection Update**:
```graphql
mutation collectionUpdate($input: CollectionInput!) {
  collectionUpdate(input: $input) {
    collection {
      id
      handle
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
```

## Limitations

- Currently only supports Shopify marketplace
- Requires valid Shopify Admin API credentials
- Rate limits apply based on Shopify API throttling
- Cannot create new products/collections (only updates existing ones)
- Handles must exactly match existing products/collections

## Future Enhancements

Planned features:
- Support for Amazon and Meesho marketplaces
- Bulk validation before processing
- Preview changes before applying
- Scheduled meta updates
- Meta tag templates
- A/B testing support

## Support

For issues or questions:
1. Check error messages in the results
2. Verify CSV format matches template
3. Ensure products/collections exist in Shopify
4. Check Shopify API credentials are valid
5. Review application logs for detailed errors

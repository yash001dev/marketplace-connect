# Bulk Upload with Variants Guide

This guide explains how to upload products with multiple variants (like Material options: Metal, Glass, Anti Yellow-Silicon) in bulk.

## Overview

The Bulk Upload with Variants feature allows you to create products with multiple material or style variants in a single upload. Each variant can have its own set of images stored in separate subfolders.

## How It Works

### 1. Folder Structure

Organize your product images in a **single folder** with variant images named after the variant:

```
product-images/
├── phone-cases/
│   ├── random1.jpg              # General product image
│   ├── random2.jpg              # General product image
│   ├── metal.jpg                # Metal variant image
│   ├── metal-2.jpg              # Metal variant image 2
│   ├── glass.jpg                # Glass variant image
│   ├── glass-1.jpg              # Glass variant image (alternative naming)
│   └── anti-yellow-silicon.jpg  # Anti Yellow-Silicon variant
└── laptop-stands/
    ├── cover.jpg                # General product image
    ├── aluminum.jpg             # Aluminum variant
    ├── aluminum-2.jpg           # Aluminum variant image 2
    ├── wood.jpg                 # Wood variant
    └── plastic.jpg              # Plastic variant
```

**Important:**
- All images go in **one folder** (no subfolders)
- **Variant-specific images**: Name after the variant (e.g., `metal.jpg` for "Metal" variant)
- **General product images**: Any images NOT matching variant names (e.g., `cover.jpg`, `product-main.jpg`)
- **Multiple images per variant**: Use `metal-1.jpg`, `metal-2.jpg` or `metal_1.jpg`, `metal_2.jpg`
- **Case insensitive**: `METAL.jpg`, `metal.jpg`, `Metal.jpg` all work
- **Spaces in names**: Replace with hyphens ("Anti Yellow-Silicon" → `anti-yellow-silicon.jpg`)

**Image Categories:**
1. **General Product Images**: Images like `cover.jpg`, `lifestyle.jpg` that don't match any variant name → Uploaded to product gallery
2. **Variant Images**: Images matching variant names → Associated with specific variants

### 2. CSV Format

Your CSV file must have these columns:

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| title | Yes | Product title | "Premium Phone Case Set" |
| description | Yes | Product description | "Protective phone cases in multiple materials" |
| metaTitle | Yes | SEO meta title | "Premium Phone Case - Multiple Materials \| YourBrand" |
| metaDescription | Yes | SEO meta description | "Shop our premium phone cases available in Metal, Glass..." |
| folderPath | Yes | Path to folder containing all images | "C:/product-images/phone-cases" |
| variantOption | Yes | Option name (Material, Color, Size, etc.) | "Material" |
| variants | Yes | Comma-separated variant values | "Metal,Glass,Anti Yellow-Silicon" |
| price | No | Price for all variants | 29.99 |
| compareAtPrice | No | Compare at price for all variants | 59.98 |
| inventory | No | Inventory quantity for all variants | 100 |
| tags | No | Product tags | "phone case,protective,accessories" |
| features | No | Product features | "Shockproof,Scratch Resistant" |

### 3. Example CSV

```csv
title,description,metaTitle,metaDescription,folderPath,variantOption,variants,price,compareAtPrice,inventory,tags,features
"Premium Phone Case Set","Protective phone cases in multiple materials","Premium Phone Case - Multiple Materials | YourBrand","Shop our premium phone cases available in Metal, Glass, and Anti-Yellow Silicon.","C:/Projects/MarketPlace/product-images/phone-cases","Material","Metal,Glass,Anti Yellow-Silicon",29.99,59.98,100,"phone case,protective","Shockproof,Scratch Resistant"
"Laptop Stand Collection","Ergonomic laptop stands in various materials","Ergonomic Laptop Stand - Multiple Finishes | YourBrand","Premium laptop stands in Aluminum, Wood, and Plastic finishes.","C:/Projects/MarketPlace/product-images/laptop-stands","Material","Aluminum,Wood,Plastic",49.99,99.98,50,"laptop,stand,ergonomic","Height Adjustable,Portable"
"T-Shirt Collection","Comfortable cotton t-shirts in various colors","Premium T-Shirts - Multiple Colors | YourBrand","Shop our premium t-shirts in Red, Blue, and Green.","C:/Projects/MarketPlace/product-images/t-shirts","Color","Red,Blue,Green",19.99,29.99,200,"clothing,t-shirt","100% Cotton,Breathable"
```

## Using the Feature

### Step 1: Prepare Your Files

1. Create folder structure with variant subfolders
2. Add images to each variant subfolder
3. Create CSV file with product details and variant names

### Step 2: Upload via Frontend

1. Navigate to **🎨 Variants** tab
2. Select marketplace (Shopify)
3. Set bulk default values (optional):
   - Default Price
   - Default Compare At Price
   - Default Inventory
   - Default Tags
   - Default Features
4. Click "Download CSV Template" for reference
5. Upload your CSV file
6. Click "Upload Products with Variants"

### Step 3: Review Results

The results dashboard shows:
- **Total Products**: Number of products processed
- **Total Variants**: Total number of variants created
- **Successful**: Successfully created products
- **Failed**: Failed products with error messages

Each result shows:
- Product title
- Number of variants created
- Success/failure status
- Error details (if any)

## Shopify Product Structure

### Product Options

Products are created with a "Material" option that contains all variant values:

```
Product: Premium Phone Case Set
├── Option: Material
│   ├── Metal
│   ├── Glass
│   └── Anti Yellow-Silicon
```

### How It Works

When you upload a product with variants:

1. **Product Creation**: A single product is created on Shopify with the specified option name (e.g., "Material", "Color")
2. **Automatic Variant Generation**: Shopify automatically creates all variants based on the option values you provide
3. **Pricing Update**: Each variant is updated with the price, compare at price, and inventory from CSV or bulk defaults
4. **Image Assignment**: Images are uploaded and automatically associated with their matching variants based on filename

### Variants

Each variant is created with:
- **Option name**: The variant option (Material, Color, Size, etc.) from CSV
- **Option value**: The variant value (Metal, Glass, Red, Blue, etc.)
- **Price**: Same for all variants or from CSV
- **Compare at price**: Same for all or from CSV
- **Inventory**: Same for all or from CSV
- **Images**: All images matching the variant name from the folder

### SEO Metadata

The product-level SEO metadata includes:
- **Meta Title**: From CSV `metaTitle` column
- **Meta Description**: From CSV `metaDescription` column

## Best Practices

### Variant Names

- Use clear, descriptive names: "Metal", "Glass", "Aluminum"
- Avoid special characters except hyphens and spaces
- Be consistent with capitalization
- Match subfolder names exactly (case-sensitive)

### Image Organization

- Use high-quality images (at least 800x800px)
- Name variant images after the variant name
- For multiple images per variant: `metal-1.jpg`, `metal-2.jpg` or `metal_1.jpg`, `metal_2.jpg`
- Use lowercase with hyphens for spaces: "Anti Yellow-Silicon" → `anti-yellow-silicon.jpg`
- Non-variant images (random names) can be general product images
- Supported formats: JPG, PNG, GIF, WebP

### Pricing Strategy

- Set individual prices in CSV or use bulk defaults
- Consider pricing variations between materials
- Use Compare At Price for discount display

### CSV Tips

- Quote fields containing commas: `"Metal,Glass,Plastic"`
- Use absolute paths for folderPath
- Verify variant names match subfolder names exactly
- Test with 1-2 products before bulk upload

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "No variant images found" | Images not named correctly | Name images after variants (metal.jpg, glass.jpg) |
| "No images found for variant: X" | Image name doesn't match variant | Check spelling and use hyphens for spaces |
| "Missing required fields" | CSV missing columns | Ensure all required columns present |
| "Failed to create variants" | Shopify API error | Check API credentials and limits |

### Validation Checklist

Before uploading:
- [ ] All images in single folder (no subfolders)
- [ ] Variant images named after variants (metal.jpg, glass.jpg)
- [ ] Spaces in variant names replaced with hyphens in filenames
- [ ] CSV has all required columns
- [ ] Paths are absolute and correct
- [ ] Variant names match image names
- [ ] Meta title/description within character limits

## API Endpoint

**Endpoint**: `POST /products/bulk-upload-variant`

**Request**:
```
Content-Type: multipart/form-data

- csvFile: [CSV file upload]
- marketplace: "shopify"
- bulkPrice: "29.99" (optional)
- bulkCompareAtPrice: "59.98" (optional)
- bulkInventory: "100" (optional)
- bulkTags: "phone case,protective" (optional)
- bulkFeatures: "Shockproof,Scratch Resistant" (optional)
```

**Response**:
```json
{
  "success": true,
  "totalProcessed": 2,
  "successCount": 2,
  "failedCount": 0,
  "totalVariants": 6,
  "results": [
    {
      "success": true,
      "productTitle": "Premium Phone Case Set",
      "variantsCreated": 3,
      "data": {
        "product": {...},
        "variants": [...],
        "media": [...]
      }
    }
  ],
  "message": "Bulk upload with variants completed. 2 products with 6 variants created, 0 failed."
}
```

## Technical Details

### Shopify GraphQL Mutations Used

1. **productCreate** - Creates base product with Material option
2. **productVariantsBulkCreate** - Creates all variants at once
3. **stagedUploadsCreate** - Stages image uploads
4. **productCreateMedia** - Attaches images to product
5. **productVariantAppendMedia** - Links images to specific variants

### Limitations

- Currently only supports Shopify marketplace
- Single option type: "Material" (can be customized)
- All variants share same price/inventory from CSV or defaults
- Maximum variants per product: Limited by Shopify (100)
- Image upload rate limits apply per Shopify tier

## Future Enhancements

Planned features:
- Multiple option types (Size, Color, Material)
- Variant-specific pricing in CSV
- Support for Amazon and Meesho
- Bulk variant updates
- Image optimization before upload
- Progress tracking during upload
- Variant inventory management

## Examples

### Example 1: Phone Cases with Material Variants

**CSV Row**:
```csv
"Premium Phone Case","Durable phone case","Premium Phone Case | Shop","Durable phone case available in Metal, Glass, and Silicon","C:/images/phone-cases","Material","Metal,Glass,Anti Yellow-Silicon",29.99,59.98,100,"phone case","Shockproof"
```

**Folder Structure**:
```
C:/images/phone-cases/
├── cover1.jpg              # General product image
├── cover2.jpg              # General product image  
├── metal.jpg               # Metal variant
├── metal-2.jpg             # Metal variant (additional)
├── glass.jpg               # Glass variant
└── anti-yellow-silicon.jpg # Anti Yellow-Silicon variant
```

**Result**: 1 product with 3 variants, each with their respective images

### Example 2: Laptop Stands with Material Variants

**CSV Row**:
```csv
"Laptop Stand","Adjustable laptop stand","Laptop Stand | Shop","Premium laptop stand in multiple finishes","C:/images/laptop-stands","Material","Aluminum,Wood,Plastic",49.99,99.98,50,"laptop,stand","Height Adjustable"
```

**Folder Structure**:
```
C:/images/laptop-stands/
├── main-view.jpg      # General product image
├── aluminum.jpg       # Aluminum variant
├── aluminum-2.jpg     # Aluminum variant (side view)
├── wood.jpg           # Wood variant
└── plastic.jpg        # Plastic variant
```

**Result**: 1 product with 3 variants (Aluminum, Wood, Plastic)

### Example 3: T-Shirts with Color Variants

**CSV Row**:
```csv
"Premium T-Shirt","Comfortable cotton t-shirt","Premium T-Shirt | Shop","100% cotton t-shirt in Red, Blue, and Green","C:/images/t-shirts","Color","Red,Blue,Green",19.99,29.99,200,"clothing,t-shirt","100% Cotton"
```

**Folder Structure**:
```
C:/images/t-shirts/
├── model-front.jpg  # General product image
├── red.jpg          # Red color variant
├── blue.jpg         # Blue color variant
└── green.jpg        # Green color variant
```

**Result**: 1 product with 3 color variants

## Support

For issues or questions:
1. Verify folder structure and image naming matches variant values
2. Check CSV format and required fields (including variantOption)
3. Ensure variant images are named correctly (lowercase, with hyphens)
4. Review error messages in results
5. Check Shopify API credentials and rate limits

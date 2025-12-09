# Bulk Product Upload Feature

## Overview
The bulk upload feature allows you to upload multiple products at once using a CSV file. Each product can have its own images stored in separate folders.

## How It Works

### 1. Prepare Your CSV File
Create a CSV file with the following columns:

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| title | Yes | Product title | "Premium Wireless Headphones" |
| description | Yes | Product description (max 130 chars) | "High-quality over-ear wireless headphones" |
| folderPath | Yes | Absolute path to folder with product images | "C:/Projects/MarketPlace/images/headphones" |
| price | No | Product price | 79.99 |
| compareAtPrice | No | Compare at price (auto-doubles if empty) | 159.98 |
| inventory | No | Stock quantity | 50 |
| tags | No | Comma-separated tags | "headphones,wireless,audio" |
| features | No | Comma-separated features | "Noise Cancellation,40hr Battery" |

### 2. Organize Product Images
Create a separate folder for each product's images:

```
C:/Projects/MarketPlace/product-images/
├── headphones/
│   ├── main.jpg
│   ├── side.jpg
│   └── back.jpg
├── smartwatch/
│   ├── front.png
│   ├── display.png
│   └── box.png
└── laptop-stand/
    ├── product.jpg
    └── usage.jpg
```

**Supported image formats**: .jpg, .jpeg, .png, .gif, .webp

### 3. Upload Process

1. Select your marketplace (Shopify, Amazon, or Meesho)
2. Upload your CSV file via the drag-and-drop interface
3. Click "Upload Products"
4. Monitor the progress and results

## CSV Template

A sample template is available at `docs/bulk-upload-template.csv`:

```csv
title,description,folderPath,price,compareAtPrice,inventory,tags,features
"Premium Wireless Headphones","High-quality over-ear wireless headphones with noise cancellation","C:/Projects/MarketPlace/product-images/headphones",79.99,159.98,50,"headphones,wireless,audio","Noise Cancellation,40hr Battery,Bluetooth 5.0"
"Smart Watch Series 5","Advanced fitness tracking smartwatch with heart rate monitor","C:/Projects/MarketPlace/product-images/smartwatch",199.99,,25,"smartwatch,fitness,wearable","Heart Rate Monitor,GPS Tracking,Waterproof"
```

## Features

### Automatic Processing
- **Image Loading**: Automatically loads all images from specified folders
- **Price Auto-Doubling**: If compareAtPrice is empty, it automatically doubles the price
- **Tag Conversion**: Converts comma-separated tags to array format
- **Feature Formatting**: Converts features to rich text bullet points in metafield
- **Sales Channels**: Automatically publishes to all available sales channels
- **Inventory Tracking**: Sets inventory quantity at primary location

### Error Handling
- Individual product failures don't stop the entire batch
- Detailed error messages for each failed product
- Success/failure counts in results
- Failed products can be re-uploaded separately

### Results Dashboard
After upload, you'll see:
- Total products processed
- Success count
- Failed count
- Detailed status for each product
- Error messages for failures

## API Endpoint

**POST** `/products/bulk-upload`

**Request**:
- `csvFile`: The CSV file (multipart/form-data)
- `marketplace`: Target marketplace (shopify, amazon, meesho)

**Response**:
```json
{
  "success": true,
  "totalProcessed": 10,
  "successCount": 9,
  "failedCount": 1,
  "results": [
    {
      "success": true,
      "productTitle": "Premium Wireless Headphones",
      "data": { /* Shopify product data */ }
    },
    {
      "success": false,
      "productTitle": "Smart Watch",
      "error": "Folder not found: C:/invalid/path"
    }
  ],
  "message": "Bulk upload completed. 9 succeeded, 1 failed."
}
```

## Best Practices

1. **Test with Small Batches**: Start with 5-10 products to verify your CSV format
2. **Use Absolute Paths**: Always use full paths for folderPath (e.g., `C:/path/to/images`)
3. **Validate Images First**: Ensure all image folders exist and contain valid images
4. **Keep Descriptions Short**: Maximum 130 characters for descriptions
5. **Organize Folders**: Use clear, consistent naming for product image folders
6. **Check Results**: Always review the results dashboard after upload

## Troubleshooting

### Common Issues

**"Folder not found"**
- Ensure the folderPath uses absolute paths
- Check for typos in folder paths
- Verify folders exist before uploading

**"No images found in folder"**
- Ensure folder contains supported image formats (.jpg, .png, etc.)
- Check file extensions are lowercase or mixed case
- Verify images aren't in subfolders

**"Missing required fields"**
- Verify CSV has title, description, and folderPath columns
- Check for empty values in required columns
- Ensure CSV header row matches expected format

**CSV Parsing Errors**
- Use double quotes for values containing commas
- Escape quotes within quoted values with double quotes ("")
- Ensure consistent number of columns per row

## Example Workflow

1. Create product folders with images:
```bash
mkdir -p C:/MarketPlace/images/product1
cp *.jpg C:/MarketPlace/images/product1/
```

2. Create CSV file:
```csv
title,description,folderPath,price,tags,features
"Product 1","Amazing product description","C:/MarketPlace/images/product1",99.99,"tag1,tag2","Feature 1,Feature 2"
```

3. Upload via frontend:
   - Navigate to Bulk Upload page
   - Select marketplace
   - Upload CSV
   - Monitor results

4. Review results:
   - Check success/failure counts
   - Review error messages for failed products
   - Fix issues and re-upload failed products

## Performance Notes

- Processing time depends on:
  - Number of products
  - Number of images per product
  - Image file sizes
  - Network speed (for uploads to marketplace)
  
- Typical processing time: 5-10 seconds per product
- Recommended batch size: 20-50 products
- For larger batches, consider splitting into multiple CSV files

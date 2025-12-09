# Marketplace Connector

A full-stack application that allows you to easily add products with media to multiple e-commerce marketplaces from a single interface.

## 🚀 Features

### Currently Supported
- ✅ **Shopify Integration** - Full product creation with media upload
  - Create products with title and description
  - Upload multiple product images
  - Automatic media staging and attachment
  - GraphQL Admin API integration
  - Product tags and custom metafields
  - Price and compare-at-price with auto-doubling
  - Inventory tracking with location management
  - Sales channel publishing (all channels)
  - Rich text features as bullet points

### Product Upload Methods
- ✨ **AI-Powered Upload** - Analyze product images with Google Gemini AI
- ✍️ **Manual Entry** - Direct product data entry with form validation
- 📁 **Bulk Upload** - Upload multiple products at once from CSV files
  - Process multiple products from CSV spreadsheet
  - Auto-load images from specified folders
  - Batch processing with individual error handling
  - Detailed success/failure reporting

### Coming Soon
- 🚧 **Amazon Integration** - In development
- 🚧 **Meesho Integration** - In development

## 📁 Project Structure

```
MarketPlace/
├── backend/          # NestJS Backend API
│   ├── src/
│   │   ├── marketplace/
│   │   │   ├── shopify/      # Shopify connector
│   │   │   ├── amazon/       # Amazon connector (placeholder)
│   │   │   └── meesho/       # Meesho connector (placeholder)
│   │   └── product/          # Product management
│   └── package.json
└── frontend/         # Next.js Frontend
    ├── app/
    ├── components/
    └── package.json
```

## 🛠️ Technology Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Axios** - HTTP client for API requests
- **Multer** - Multipart/form-data file upload
- **Form-Data** - Construct multipart/form-data streams

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Dropzone** - File upload with drag & drop
- **React Hot Toast** - Beautiful notifications
- **Lucide React** - Icon library

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Shopify store with Admin API access
- Shopify Admin API access token with `read_products` and `write_products` scopes

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd MarketPlace
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env
```

**Configure your `.env` file:**

```env
PORT=3001
NODE_ENV=development

# Shopify Configuration
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx
SHOPIFY_API_VERSION=2024-01

FRONTEND_URL=http://localhost:3000
```

**Start the backend:**

```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.local.example .env.local
```

**Configure your `.env.local` file:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Start the frontend:**

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start
```

The frontend will run on `http://localhost:3000`

## 🔐 Shopify Setup

### 1. Create a Custom App

1. Go to your Shopify admin panel
2. Navigate to **Settings** > **Apps and sales channels** > **Develop apps**
3. Click **Create an app**
4. Give it a name (e.g., "Marketplace Connector")

### 2. Configure API Scopes

Under **Configuration** > **Admin API integration**, select:
- `read_products`
- `write_products`

### 3. Install the App and Get Access Token

1. Click **Install app**
2. Copy the **Admin API access token**
3. Add it to your backend `.env` file as `SHOPIFY_ACCESS_TOKEN`

### 4. Get Your Store URL

Your store URL is in the format: `your-store.myshopify.com`

## 📖 API Documentation

### Backend API Endpoints

#### Create Product
```http
POST /products
Content-Type: multipart/form-data
```

**Body:**
- `title` (string, required) - Product title
- `description` (string, required) - Product description
- `marketplace` (enum, required) - One of: `shopify`, `amazon`, `meesho`
- `images` (files, optional) - Product images (max 10 files, 20MB each)

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "id": "gid://shopify/Product/123456",
      "title": "My Product",
      "description": "Product description",
      "status": "ACTIVE"
    },
    "media": [
      {
        "filename": "image1.jpg",
        "status": "success",
        "media": {
          "id": "gid://shopify/MediaImage/789",
          "alt": "image1.jpg",
          "mediaContentType": "IMAGE"
        }
      }
    ],
    "totalImages": 1
  }
}
```

#### Bulk Upload Products
```http
POST /products/bulk-upload
Content-Type: multipart/form-data
```

**Body:**
- `csvFile` (file, required) - CSV file with product data
- `marketplace` (enum, required) - One of: `shopify`, `amazon`, `meesho`

**CSV Format:**
```csv
title,description,folderPath,price,compareAtPrice,inventory,tags,features
"Product 1","Description 1","C:/path/to/images/product1",99.99,199.98,50,"tag1,tag2","feature1,feature2"
```

**Response:**
```json
{
  "success": true,
  "totalProcessed": 10,
  "successCount": 9,
  "failedCount": 1,
  "results": [
    {
      "success": true,
      "productTitle": "Product 1",
      "data": { /* product data */ }
    },
    {
      "success": false,
      "productTitle": "Product 2",
      "error": "Folder not found"
    }
  ],
  "message": "Bulk upload completed. 9 succeeded, 1 failed."
}
```

See [Bulk Upload Guide](docs/BULK_UPLOAD_GUIDE.md) for detailed instructions.

## 🎨 Frontend Usage

### Single Product Upload

1. Open `http://localhost:3000` in your browser
2. Choose upload method:
   - **AI-Powered**: Upload images and let AI generate product details
   - **Manual Entry**: Fill out product form manually
3. Select a marketplace (currently only Shopify is available)
4. Enter product details (title, description, price, tags, features, etc.)
5. Drag & drop or click to upload product images
6. Click "Create Product"
7. Wait for success notification

### Bulk Product Upload

1. Prepare a CSV file with product data (see [template](docs/bulk-upload-template.csv))
2. Organize product images into separate folders
3. Navigate to the **Bulk Upload** tab
4. Select marketplace
5. Upload CSV file
6. Click "Upload Products"
7. Monitor progress and review results

For detailed bulk upload instructions, see [Bulk Upload Guide](docs/BULK_UPLOAD_GUIDE.md).

## 🔧 Development

### Backend Development

```bash
cd backend

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

### Frontend Development

```bash
cd frontend

# Lint code
npm run lint

# Build for production
npm run build
```

## 📝 How It Works - Shopify Integration

The Shopify integration follows the official product media guide:

### 1. Product Creation
- Creates a basic product using `productCreate` mutation
- Sets title, description, and status

### 2. Media Upload Process
For each image:
1. **Generate Staged Upload** - Use `stagedUploadsCreate` mutation to get upload URL and parameters
2. **Upload to Staged URL** - POST the file with form-data to Google Cloud Storage
3. **Attach Media to Product** - Use `productCreateMedia` mutation to link media to product

### 3. Media Validation
- Supports: PNG, JPG, JPEG, GIF, WEBP
- Max file size: 20MB
- Max resolution: 20MP
- Max dimensions: 4472 x 4472 px

## 🚧 Future Enhancements

### Amazon Integration (Planned)
- MWS/SP-API integration
- Product listing with images
- Inventory management

### Meesho Integration (Planned)
- Meesho API integration
- Bulk product upload
- Category mapping

### Additional Features
- Bulk product import from CSV
- Product template management
- Multi-marketplace sync
- Inventory tracking
- Price management
- Product analytics

## 🐛 Troubleshooting

### Backend Issues

**"Failed to generate staged upload"**
- Verify your Shopify access token has `write_products` scope
- Check if your store URL is correct in `.env`
- Ensure API version is compatible (2024-01 or later)

**"Upload to staged URL failed"**
- Check file size (must be under 20MB)
- Verify file format is supported
- Check network connectivity

### Frontend Issues

**"Failed to create product"**
- Ensure backend is running on the correct port
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS is enabled in backend

**Images not uploading**
- Check file format (PNG, JPG, JPEG, GIF, WEBP only)
- Ensure files are under 20MB each
- Try with fewer images

## 📄 License

MIT

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for seamless marketplace integration**

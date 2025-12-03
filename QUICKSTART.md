# Quick Start Guide

Get your Marketplace Connector up and running in 5 minutes!

## ⚡ Quick Setup

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

### 2. Configure Shopify

Create `.env` in `backend/` folder:

```env
PORT=3001
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx
SHOPIFY_API_VERSION=2024-01
FRONTEND_URL=http://localhost:3000
```

Create `.env.local` in `frontend/` folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Start Both Servers

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Open Browser

Visit: `http://localhost:3000`

## 🎯 Create Your First Product

1. **Select Shopify** (only active marketplace currently)
2. **Enter Product Title**: e.g., "Premium Watch"
3. **Enter Description**: e.g., "High-quality stainless steel watch"
4. **Upload Images**: Drag & drop or click to upload (up to 10 images, 20MB each)
5. **Click "Create Product"**
6. **Wait for Success** ✅

## 🔑 Get Shopify Credentials

### Quick Method:

1. Go to: `https://your-store.myshopify.com/admin/settings/apps/development`
2. Click **"Create an app"**
3. Name it: "Marketplace Connector"
4. Click **"Configuration"** → **"Configure Admin API scopes"**
5. Select: `read_products` and `write_products`
6. Click **"Save"**
7. Click **"Install app"**
8. Copy the **Admin API access token**
9. Paste into `backend/.env` as `SHOPIFY_ACCESS_TOKEN`

## ✅ Verify Setup

### Backend Health Check

Visit: `http://localhost:3001`

Should see: NestJS server response

### Frontend Check

Visit: `http://localhost:3000`

Should see: Marketplace Connector form

## 🐛 Troubleshooting

### "Cannot connect to backend"
✅ Ensure backend is running on port 3001
✅ Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`

### "Invalid access token"
✅ Verify token starts with `shpat_`
✅ Check token has `write_products` scope
✅ Ensure no extra spaces in `.env` file

### "Upload failed"
✅ Check image size (< 20MB)
✅ Verify image format (JPG, PNG, GIF, WEBP)
✅ Check Shopify store plan limits

## 📁 Project Structure

```
MarketPlace/
├── backend/           # NestJS API
│   ├── src/
│   │   ├── marketplace/
│   │   │   ├── shopify/
│   │   │   ├── amazon/
│   │   │   └── meesho/
│   │   └── product/
│   ├── .env          # ← Configure this
│   └── package.json
└── frontend/          # Next.js UI
    ├── app/
    ├── components/
    ├── .env.local    # ← Configure this
    └── package.json
```

## 🚀 Next Steps

1. ✅ Create test product
2. 📖 Read full [README.md](../README.md)
3. 📚 Check [Shopify Integration Guide](../docs/SHOPIFY_INTEGRATION.md)
4. 🔧 Customize for your needs
5. 🌟 Add Amazon/Meesho connectors

## 💡 Tips

- **Development**: Both servers auto-reload on file changes
- **Testing**: Use test product data before production
- **Images**: Optimize images before upload for faster processing
- **Errors**: Check browser console and terminal for detailed errors

## 📞 Need Help?

- 📖 Read the full documentation in [README.md](../README.md)
- 🔍 Check [SHOPIFY_INTEGRATION.md](../docs/SHOPIFY_INTEGRATION.md)
- 🐛 Open an issue on GitHub

---

**Happy Selling! 🎉**

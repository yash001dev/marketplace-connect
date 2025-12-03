# Environment Configuration Guide

Complete guide for setting up environment variables for the Marketplace Connector.

## 📋 Overview

The project requires environment configuration for both backend and frontend:

- **Backend**: Marketplace API credentials and server configuration
- **Frontend**: API endpoint configuration

## 🔧 Backend Configuration

### Location
`backend/.env`

### Template
Copy from `backend/.env.example`:
```bash
cp backend/.env.example backend/.env
```

### Required Variables

#### Server Configuration
```env
# Port for backend server
PORT=3001

# Environment (development, staging, production)
NODE_ENV=development
```

#### Shopify Configuration
```env
# Your Shopify store URL (without https://)
SHOPIFY_STORE_URL=your-store-name.myshopify.com

# Shopify Admin API access token
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Shopify API version
SHOPIFY_API_VERSION=2024-01
```

#### CORS Configuration
```env
# Frontend URL for CORS (must match your frontend)
FRONTEND_URL=http://localhost:3000
```

### Getting Shopify Credentials

#### 1. Create Custom App

1. Go to Shopify Admin: `https://your-store.myshopify.com/admin`
2. Navigate to: **Settings** → **Apps and sales channels**
3. Click: **Develop apps**
4. Click: **Create an app**
5. Enter name: "Marketplace Connector"
6. Click: **Create app**

#### 2. Configure API Scopes

1. Click: **Configuration** tab
2. Click: **Configure Admin API scopes**
3. Under **Products** section, check:
   - ✅ `read_products` - View products, variants, and collections
   - ✅ `write_products` - Modify products, variants, and collections
4. Click: **Save**

#### 3. Install App

1. Click: **Install app** button
2. Confirm installation
3. **Copy the Admin API access token** (starts with `shpat_`)
   - ⚠️ **IMPORTANT**: Save this token immediately - you won't see it again!

#### 4. Get Store URL

Your store URL is in the format:
```
your-store-name.myshopify.com
```

Example:
- Full URL: `https://my-awesome-store.myshopify.com`
- Use in config: `my-awesome-store.myshopify.com`

### Example Backend .env

```env
PORT=3001
NODE_ENV=development

SHOPIFY_STORE_URL=my-awesome-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_abc123def456ghi789jkl012mno345pqr678
SHOPIFY_API_VERSION=2024-01

FRONTEND_URL=http://localhost:3000
```

## 🎨 Frontend Configuration

### Location
`frontend/.env.local`

### Template
Copy from `frontend/.env.local.example`:
```bash
cp frontend/.env.local.example frontend/.env.local
```

### Required Variables

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Environment-Specific Configuration

#### Development
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Staging
```env
NEXT_PUBLIC_API_URL=https://api-staging.yourdomain.com
```

#### Production
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## 🔒 Security Best Practices

### DO ✅

- ✅ Use `.env` files for sensitive data
- ✅ Keep `.env` files out of version control
- ✅ Use different tokens for dev/staging/production
- ✅ Rotate API tokens regularly (every 90 days)
- ✅ Use strong, unique tokens
- ✅ Limit API scopes to minimum required
- ✅ Use HTTPS in production
- ✅ Store backup of tokens securely (password manager)

### DON'T ❌

- ❌ Commit `.env` files to Git
- ❌ Share API tokens in chat/email
- ❌ Use production tokens in development
- ❌ Hardcode credentials in source code
- ❌ Use same token across multiple apps
- ❌ Share tokens publicly
- ❌ Store tokens in plain text files

## 🔍 Verification

### Check Backend Configuration

1. Ensure `.env` file exists:
```bash
ls backend/.env
```

2. Verify required variables are set:
```bash
cd backend
cat .env
```

Should show all variables with actual values (not example values).

### Check Frontend Configuration

1. Ensure `.env.local` file exists:
```bash
ls frontend/.env.local
```

2. Verify API URL:
```bash
cd frontend
cat .env.local
```

### Test Backend Connection

1. Start backend:
```bash
cd backend
npm run start:dev
```

2. Check console output:
```
🚀 Marketplace Connector Backend running on: http://localhost:3001
```

3. Test endpoint:
```bash
curl http://localhost:3001
```

### Test Frontend Connection

1. Start frontend:
```bash
cd frontend
npm run dev
```

2. Open browser: `http://localhost:3000`
3. Open browser console (F12)
4. Check for any API errors

## 🐛 Troubleshooting

### "Cannot find .env file"

**Problem**: .env file doesn't exist

**Solution**:
```bash
cd backend
cp .env.example .env
# Then edit .env with your credentials
```

### "Invalid access token"

**Problem**: Token is incorrect or expired

**Solutions**:
1. Verify token starts with `shpat_`
2. Check for extra spaces or newlines
3. Regenerate token from Shopify admin
4. Ensure app is installed on your store

### "Access denied for productCreate field"

**Problem**: Missing API scopes

**Solutions**:
1. Go to app configuration in Shopify
2. Add `write_products` scope
3. Reinstall the app
4. Get new access token

### "CORS error"

**Problem**: Frontend URL doesn't match CORS configuration

**Solutions**:
1. Verify `FRONTEND_URL` in backend `.env`
2. Ensure it matches your frontend URL exactly
3. Restart backend server after changes

### "Backend not reachable"

**Problem**: API URL is incorrect

**Solutions**:
1. Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
2. Ensure backend is running
3. Test backend URL directly: `curl http://localhost:3001`

## 📝 Environment Variables Checklist

### Backend Setup ✅

- [ ] Created `backend/.env` file
- [ ] Set `PORT=3001`
- [ ] Set `NODE_ENV=development`
- [ ] Set `SHOPIFY_STORE_URL` (without https://)
- [ ] Set `SHOPIFY_ACCESS_TOKEN` (starts with shpat_)
- [ ] Set `SHOPIFY_API_VERSION=2024-01`
- [ ] Set `FRONTEND_URL=http://localhost:3000`
- [ ] Verified all values are correct
- [ ] No extra spaces or quotes in values

### Frontend Setup ✅

- [ ] Created `frontend/.env.local` file
- [ ] Set `NEXT_PUBLIC_API_URL=http://localhost:3001`
- [ ] Verified URL matches backend port

### Shopify App Setup ✅

- [ ] Created custom app in Shopify
- [ ] Configured API scopes (read_products, write_products)
- [ ] Installed app to store
- [ ] Copied access token
- [ ] Saved token securely

## 🔄 Updating Configuration

### Changing API Version

When Shopify releases a new API version:

1. Update backend `.env`:
```env
SHOPIFY_API_VERSION=2024-04
```

2. Restart backend:
```bash
cd backend
npm run start:dev
```

3. Test thoroughly before deploying

### Changing Ports

If you need to use different ports:

1. Update backend `.env`:
```env
PORT=3002
```

2. Update frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

3. Update backend `.env` FRONTEND_URL if needed

4. Restart both servers

## 📚 Additional Resources

- [Shopify App Setup Guide](https://shopify.dev/docs/apps/build)
- [API Access Scopes](https://shopify.dev/docs/api/usage/access-scopes)
- [Environment Variables in Next.js](https://nextjs.org/docs/basic-features/environment-variables)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)

---

**Remember**: Never commit `.env` files to version control!

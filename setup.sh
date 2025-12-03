#!/bin/bash

# Marketplace Connector Setup Script
# This script helps you set up the project quickly

echo "🚀 Marketplace Connector Setup"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the MarketPlace root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Node.js
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js version: $NODE_VERSION"

# Check for npm
if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm version: $NPM_VERSION"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -f "package.json" ]; then
    echo "❌ backend/package.json not found"
    exit 1
fi
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
echo "✅ Backend dependencies installed"
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
if [ ! -f "package.json" ]; then
    echo "❌ frontend/package.json not found"
    exit 1
fi
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
echo "✅ Frontend dependencies installed"
cd ..

# Check for .env files
echo ""
echo "🔧 Checking configuration files..."

if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found"
    echo "   Creating from .env.example..."
    cp backend/.env.example backend/.env
    echo "   ⚠️  Please edit backend/.env with your Shopify credentials"
    ENV_NEEDS_CONFIG=true
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  frontend/.env.local not found"
    echo "   Creating from .env.local.example..."
    cp frontend/.env.local.example frontend/.env.local
    echo "   ✅ Frontend configuration created"
fi

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""

if [ "$ENV_NEEDS_CONFIG" = true ]; then
    echo "⚠️  IMPORTANT: Configure your Shopify credentials"
    echo ""
    echo "Edit backend/.env and set:"
    echo "  - SHOPIFY_STORE_URL=your-store.myshopify.com"
    echo "  - SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx"
    echo ""
fi

echo "To start the development servers:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  npm run start:dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "📖 For more info, see QUICKSTART.md or README.md"
echo ""

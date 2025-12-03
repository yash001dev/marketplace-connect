@echo off
REM Marketplace Connector Setup Script for Windows
REM This script helps you set up the project quickly

echo ========================================
echo    Marketplace Connector Setup
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "backend" (
    echo ERROR: backend folder not found
    echo Please run this script from the MarketPlace root directory
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERROR: frontend folder not found
    echo Please run this script from the MarketPlace root directory
    pause
    exit /b 1
)

REM Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js 18+ first from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%

REM Check for npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo npm version: %NPM_VERSION%
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
if not exist "package.json" (
    echo ERROR: backend/package.json not found
    pause
    exit /b 1
)
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo Backend dependencies installed
cd ..

REM Install frontend dependencies
echo.
echo Installing frontend dependencies...
cd frontend
if not exist "package.json" (
    echo ERROR: frontend/package.json not found
    pause
    exit /b 1
)
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo Frontend dependencies installed
cd ..

REM Check for .env files
echo.
echo Checking configuration files...

set ENV_NEEDS_CONFIG=0

if not exist "backend\.env" (
    echo WARNING: backend\.env not found
    echo Creating from .env.example...
    copy backend\.env.example backend\.env >nul
    echo Please edit backend\.env with your Shopify credentials
    set ENV_NEEDS_CONFIG=1
)

if not exist "frontend\.env.local" (
    echo WARNING: frontend\.env.local not found
    echo Creating from .env.local.example...
    copy frontend\.env.local.example frontend\.env.local >nul
    echo Frontend configuration created
)

echo.
echo ========================================
echo          Setup Complete!
echo ========================================
echo.

if %ENV_NEEDS_CONFIG%==1 (
    echo IMPORTANT: Configure your Shopify credentials
    echo.
    echo Edit backend\.env and set:
    echo   - SHOPIFY_STORE_URL=your-store.myshopify.com
    echo   - SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
    echo.
)

echo To start the development servers:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   npm run start:dev
echo.
echo Terminal 2 - Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo.
echo For more info, see QUICKSTART.md or README.md
echo.
pause

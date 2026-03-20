#!/bin/bash

# Gaming Accounts Marketplace - Production Build Script
# For Infinty Free Deployment

echo "🚀 Starting Production Build..."

# Create production directory
mkdir -p production
cd production

# Build Frontend
echo "📦 Building Frontend..."
cd ../frontend
npm ci --only=production
npm run build

# Copy frontend build to production
cp -r build ../production/frontend

# Prepare Backend
echo "🔧 Preparing Backend..."
cd ../backend
cp package.production.json package.json
npm ci --only=production

# Copy backend files to production
cp -r . ../production/backend

# Create data directory
mkdir -p ../production/backend/data

# Create production environment file
echo "📝 Creating production environment..."
cat > ../production/backend/.env << EOL
NODE_ENV=production
PORT=5000
EOL

# Create start script
cat > ../production/start.sh << EOL
#!/bin/bash
echo "🚀 Starting Alpha Store Backend..."
cd backend
npm start
EOL

chmod +x ../production/start.sh

# Create deployment info
cat > ../production/README.txt << EOL
Alpha Store - Production Build
================================

Files Structure:
- frontend/     : React app build files
- backend/      : Node.js server files
- start.sh      : Server startup script

Deployment Instructions:
1. Upload entire production folder to your hosting
2. Set permissions: chmod +x start.sh
3. Run: ./start.sh

Environment Variables (if needed):
- NODE_ENV=production
- PORT=5000

API Endpoints:
- GET  /api/products
- POST /api/products
- GET  /api/orders
- POST /api/orders
- POST /api/auth/login
- POST /api/auth/register

Static Files:
- Frontend: frontend/
- Uploads: backend/public/

Built on: $(date)
Ready for Infinty Free deployment! 🚀
EOL

cd ..
echo "✅ Production build complete!"
echo "📁 Files ready in: ./production/"
echo "🚀 Ready for Infinty Free deployment!"
echo ""
echo "Next steps:"
echo "1. Upload 'production' folder to your hosting"
echo "2. Configure environment variables if needed"
echo "3. Run './start.sh' to start the server"

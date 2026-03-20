@echo off
echo 🚀 Starting Production Build...

REM Create production directory
if not exist production mkdir production
cd production

REM Build Frontend
echo 📦 Building Frontend...
cd ..\frontend
call npm ci --only=production
call npm run build

REM Copy frontend build to production
xcopy /E /I build ..\production\frontend

REM Prepare Backend
echo 🔧 Preparing Backend...
cd ..\backend
copy package.production.json package.json
call npm ci --only=production

REM Copy backend files to production
xcopy /E /I . ..\production\backend

REM Create data directory
if not exist ..\production\backend\data mkdir ..\production\backend\data

REM Create production environment file
echo 📝 Creating production environment...
echo NODE_ENV=production > ..\production\backend\.env
echo PORT=5000 >> ..\production\backend\.env

REM Create start script
echo @echo off > ..\production\start.bat
echo echo 🚀 Starting Alpha Store Backend... >> ..\production\start.bat
echo cd backend >> ..\production\start.bat
echo npm start >> ..\production\start.bat

REM Create deployment info
echo Alpha Store - Production Build > ..\production\README.txt
echo ================================ >> ..\production\README.txt
echo. >> ..\production\README.txt
echo Files Structure: >> ..\production\README.txt
echo - frontend/     : React app build files >> ..\production\README.txt
echo - backend/      : Node.js server files >> ..\production\README.txt
echo - start.bat     : Server startup script >> ..\production\README.txt
echo. >> ..\production\README.txt
echo Deployment Instructions: >> ..\production\README.txt
echo 1. Upload entire production folder to your hosting >> ..\production\README.txt
echo 2. Run 'start.bat' to start the server >> ..\production\README.txt
echo. >> ..\production\README.txt
echo Environment Variables (if needed): >> ..\production\README.txt
echo - NODE_ENV=production >> ..\production\README.txt
echo - PORT=5000 >> ..\production\README.txt
echo. >> ..\production\README.txt
echo API Endpoints: >> ..\production\README.txt
echo - GET  /api/products >> ..\production\README.txt
echo - POST /api/products >> ..\production\README.txt
echo - GET  /api/orders >> ..\production\README.txt
echo - POST /api/orders >> ..\production\README.txt
echo - POST /api/auth/login >> ..\production\README.txt
echo - POST /api/auth/register >> ..\production\README.txt
echo. >> ..\production\README.txt
echo Static Files: >> ..\production\README.txt
echo - Frontend: frontend/ >> ..\production\README.txt
echo - Uploads: backend/public/ >> ..\production\README.txt

cd ..
echo ✅ Production build complete!
echo 📁 Files ready in: .\production\
echo 🚀 Ready for Infinty Free deployment!
echo.
echo Next steps:
echo 1. Upload 'production' folder to your hosting
echo 2. Configure environment variables if needed
echo 3. Run 'start.bat' to start the server

pause

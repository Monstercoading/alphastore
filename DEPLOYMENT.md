# Gaming Accounts Marketplace - Deployment Guide

## Project Structure
```
gaming-accounts-marketplace/
├── frontend/          # React frontend
├── backend/           # Express backend
└── README.md         # This file
```

## For Infinty Free Deployment

### 1. Frontend Deployment (Vercel/Netlify style)

**Build Commands:**
```bash
cd frontend
npm install
npm run build
```

**Output Directory:** `frontend/build`

**Environment Variables:**
```
REACT_APP_API_URL=http://your-backend-url:5000/api
REACT_APP_UPLOADS_URL=http://your-backend-url:5000
```

### 2. Backend Deployment (Node.js)

**Start Command:** `npm start`

**Environment Variables:**
```
NODE_ENV=production
PORT=5000
```

**Required Dependencies:**
```json
{
  "dependencies": {
    "express": "^4.22.1",
    "cors": "^2.8.6",
    "dotenv": "^16.6.1"
  }
}
```

## Pre-deployment Checklist

### Frontend ✅
- [x] API URLs updated to production IP
- [x] Build optimized for production
- [x] Environment variables configured
- [x] Static assets optimized

### Backend ✅
- [x] MongoDB removed, using JSON files
- [x] CORS enabled for all origins
- [x] Static file serving configured
- [x] Production dependencies only

## Deployment Steps

### Step 1: Build Frontend
```bash
cd frontend
npm ci --only=production
npm run build
```

### Step 2: Prepare Backend
```bash
cd backend
npm ci --only=production
mkdir -p data
```

### Step 3: Upload Files
Upload these folders to your hosting:
- `frontend/build/` → Public web directory
- `backend/` → Server directory

### Step 4: Configure Environment
Set production environment variables on your hosting panel.

### Step 5: Start Services
1. Start backend server
2. Access frontend through web server

## File Paths After Deployment

**Frontend Assets:** `/public/` (or equivalent)
**Backend API:** `/api/`
**Uploads:** `/uploads/`

## Troubleshooting

### Common Issues:
1. **CORS Errors:** Ensure backend allows frontend domain
2. **404 Errors:** Check API URL configuration
3. **Image Loading:** Verify uploads directory permissions
4. **Database Issues:** Check JSON file permissions

### Logs to Monitor:
- Backend server logs
- Frontend console errors
- Network requests in browser dev tools

## Performance Optimization

### Frontend:
- ✅ Code splitting enabled
- ✅ Images optimized
- ✅ Bundle size minimized

### Backend:
- ✅ JSON file storage (fast I/O)
- ✅ Static file caching
- ✅ Minimal dependencies

## Security Notes

- ✅ No hardcoded credentials
- ✅ CORS properly configured
- ✅ File uploads validated
- ✅ Environment variables used

## Support

For deployment issues:
1. Check this guide first
2. Review hosting provider documentation
3. Test locally before deploying

---

**Ready for Infinty Free deployment! 🚀**

# Alpha Store Backend

Backend API for Gaming Accounts Marketplace using Node.js, Express, and MongoDB Atlas.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
Create a `.env` file in the backend root:
```env
MONGO_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/gaming-accounts?retryWrites=true&w=majority
PORT=5000
NODE_ENV=production
```

4. **Start the server:**
```bash
# Development
npm run dev

# Production
npm start
```

## 📁 Project Structure

```
backend/
├── .gitignore          # Git ignore rules
├── .env                # Environment variables (not in git)
├── package.json        # Dependencies & scripts
├── server.js           # Main server file
├── README.md           # This file
├── public/             # Static files
│   └── uploads/        # Image uploads
└── data/               # JSON backup (if needed)
```

## 🔌 API Endpoints

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/user/:email` - Get user orders
- `POST /api/orders` - Create order (sends admin notification)
- `PUT /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Admin Notifications
- `GET /api/admin/notifications` - SSE stream for real-time notifications

## 🌐 Deployment on Render

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Initial backend setup"
git push origin main
```

### Step 2: Create Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the backend folder (if monorepo)

### Step 3: Configure Service
- **Name:** `alpha-store-api`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** Free

### Step 4: Environment Variables
Add these in Render dashboard:
```
MONGO_URI=mongodb+srv://monster:3621447aA@cluster0.2ragjzw.mongodb.net/gaming-accounts?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=production
PORT=10000
```

### Step 5: Deploy
Click "Create Web Service" and wait for deployment!

## 📦 Package.json Scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

## 🔒 Security Notes

- Never commit `.env` file
- Use strong MongoDB Atlas password
- Enable IP whitelist in MongoDB Atlas
- Use environment variables for sensitive data

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Add authorized redirect URIs:
   - For production: `https://alphastore-ap.onrender.com/auth/google/callback`
   - For local: `http://localhost:3000/auth/google/callback`
5. Save changes

### Environment Variables on Render

Add these in Render dashboard → Environment:
```
GOOGLE_CLIENT_ID=866642345311-4kiub26p4228g5q7edh3svh05vmn19gn.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret-here
GOOGLE_REDIRECT_URI=https://alphastore-ap.onrender.com/auth/google/callback
```

## 🧪 Testing

Test the API locally:
```bash
# Get all products
curl http://localhost:5000/api/products

# Create order
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"user":{"email":"test@test.com","firstName":"Test","lastName":"User"},"games":[],"totalAmount":100}'
```

## 🆘 Troubleshooting

### MongoDB Connection Error
- Check `MONGO_URI` in `.env`
- Verify IP whitelist in MongoDB Atlas
- Ensure password is URL-encoded

### Port Already in Use
Change `PORT` in `.env` or use:
```bash
PORT=3000 npm start
```

### Module Not Found
```bash
rm -rf node_modules
npm install
```

## 📞 Support

For issues or questions, contact the development team.

---

**Ready for production! 🚀**

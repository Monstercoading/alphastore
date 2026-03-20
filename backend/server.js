const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Atlas Connection String (MUST be set in .env)
const MONGO_URI = process.env.MONGO_URI;

// Verify MONGO_URI is set
if (!MONGO_URI) {
  console.error('❌ Error: MONGO_URI environment variable is not set');
  console.error('Please set MONGO_URI in your .env file');
  process.exit(1);
}

// Connect to MongoDB Atlas
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Atlas connected successfully'))
.catch(err => {
  console.error('❌ MongoDB Atlas connection error:', err);
  process.exit(1);
});

// CORS Configuration - Allow Netlify and local development
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://silver-frangipane-2ddeca.netlify.app';
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files from public/uploads specifically
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ========== MONGOOSE MODELS ==========

// Product Model
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: Number,
  discount: Number,
  platform: { type: String, required: true },
  region: { type: String, required: true },
  images: [String],
  availability: { type: String, required: true, enum: ['available', 'sold', 'reserved'], default: 'available' },
  isNew: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Order Model
const orderSchema = new mongoose.Schema({
  user: {
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true }
  },
  games: [{
    game: {
      _id: { type: String, required: true },
      title: { type: String, required: true },
      platform: { type: String, required: true },
      price: { type: Number, required: true },
      images: [String]
    },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'sent', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// User Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const User = mongoose.model('User', userSchema);

// ========== ADMIN NOTIFICATION SYSTEM ==========

// Store recent orders for notification tracking
const recentOrders = [];
let adminNotificationListeners = [];

// Send notification to admin listeners
const notifyAdmins = (order) => {
  const notification = {
    type: 'NEW_ORDER',
    message: `طلب جديد من ${order.user.firstName} ${order.user.lastName}!`,
    orderId: order._id.toString(),
    totalAmount: order.totalAmount,
    userName: `${order.user.firstName} ${order.user.lastName}`,
    timestamp: new Date().toISOString()
  };

  // Add to recent orders
  recentOrders.unshift(notification);
  if (recentOrders.length > 10) recentOrders.pop();

  // Notify all listeners
  adminNotificationListeners.forEach(listener => {
    try {
      listener.res.write(`data: ${JSON.stringify(notification)}\n\n`);
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  });

  console.log(`🔔 Admin notification sent: ${notification.message}`);
};

// ========== PRODUCTS API ==========

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products', message: err.message });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Failed to fetch product', message: err.message });
  }
});

// Create new product (admin)
app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product', message: err.message });
  }
});

// Update product (admin)
app.put('/api/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(updatedProduct);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product', message: err.message });
  }
});

// Delete product (admin)
app.delete('/api/products/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product', message: err.message });
  }
});

// ========== ORDERS API ==========

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders', message: err.message });
  }
});

// Get orders by user email
app.get('/api/orders/user/:email', async (req, res) => {
  try {
    const orders = await Order.find({ 'user.email': req.params.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ error: 'Failed to fetch user orders', message: err.message });
  }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order', message: err.message });
  }
});

// Create new order with admin notification
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order({
      ...req.body,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedOrder = await order.save();
    
    // Notify admins immediately
    notifyAdmins(savedOrder);
    
    console.log(`✅ New order created: ${savedOrder._id} from ${savedOrder.user.email}`);
    console.log(`🔔 Admin notification sent!`);
    
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order', message: err.message });
  }
});

// Update order status (admin)
app.put('/api/orders/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(updatedOrder);
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order', message: err.message });
  }
});

// Delete order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order', message: err.message });
  }
});

// ========== ORDER MANAGEMENT ==========

// Export orders to JSON
app.get('/api/orders/export', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalOrders: orders.length,
      orders: orders
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="orders-export-${Date.now()}.json"`);
    res.json(exportData);
  } catch (err) {
    console.error('Error exporting orders:', err);
    res.status(500).json({ error: 'Failed to export orders', message: err.message });
  }
});

// Get order statistics
app.get('/api/orders/stats', async (req, res) => {
  try {
    const total = await Order.countDocuments();
    const pending = await Order.countDocuments({ status: 'pending' });
    const sent = await Order.countDocuments({ status: 'sent' });
    const completed = await Order.countDocuments({ status: 'completed' });
    const cancelled = await Order.countDocuments({ status: 'cancelled' });
    
    const revenueResult = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    res.json({
      total,
      pending,
      sent,
      completed,
      cancelled,
      totalRevenue
    });
  } catch (err) {
    console.error('Error getting order stats:', err);
    res.status(500).json({ error: 'Failed to get order stats', message: err.message });
  }
});

// ========== USERS API ==========

// Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const newUser = new User({
      email,
      password,
      firstName,
      lastName
    });
    
    const savedUser = await newUser.save();
    const { password: _, ...userWithoutPassword } = savedUser.toObject();
    
    res.status(201).json({ 
      user: userWithoutPassword, 
      token: 'fake-jwt-token-' + savedUser._id 
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Failed to register user', message: err.message });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ 
      user: userWithoutPassword, 
      token: 'fake-jwt-token-' + user._id 
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: 'Failed to login', message: err.message });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const userId = token.replace('fake-jwt-token-', '');
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Error getting user:', err);
    res.status(500).json({ error: 'Failed to get user', message: err.message });
  }
});

// ========== ADMIN NOTIFICATIONS SSE ==========

// SSE endpoint for real-time admin notifications
app.get('/api/admin/notifications', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial connection message
  res.write('data: {"type":"CONNECTED","message":"Admin notification system connected"}\n\n');
  
  // Send recent orders
  if (recentOrders.length > 0) {
    recentOrders.forEach(order => {
      res.write(`data: ${JSON.stringify(order)}\n\n`);
    });
  }
  
  // Add to listeners
  const listener = { res, id: Date.now() };
  adminNotificationListeners.push(listener);
  
  // Keep connection alive
  const keepAlive = setInterval(() => {
    try {
      res.write('data: {"type":"PING"}\n\n');
    } catch (err) {
      clearInterval(keepAlive);
    }
  }, 30000);
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    adminNotificationListeners = adminNotificationListeners.filter(l => l.id !== listener.id);
    console.log('Admin notification client disconnected');
  });
});

// ========== ROOT ROUTE ==========

app.get('/', (req, res) => {
  res.json({
    message: 'Alpha Store API - MongoDB Atlas',
    status: 'running',
    version: '2.0.0',
    database: 'MongoDB Atlas',
    endpoints: {
      products: '/api/products',
      orders: '/api/orders',
      auth: '/api/auth',
      notifications: '/api/admin/notifications'
    }
  });
});

// ========== ERROR HANDLING ==========

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 MongoDB Atlas: Connected`);
  console.log(`📊 API Endpoints:`);
  console.log(`   - Products: GET/POST/PUT/DELETE /api/products`);
  console.log(`   - Orders:   GET/POST/PUT/DELETE /api/orders`);
  console.log(`   - Auth:     POST /api/auth/login, /api/auth/register`);
  console.log(`   - Notifications: GET /api/admin/notifications (SSE)`);
  console.log(`✅ Ready for production!`);
});

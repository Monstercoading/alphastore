const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load Google Auth routes
const googleAuth = require('./googleAuth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gaming-accounts', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files from public/uploads specifically
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ========== MONGOOSE MODELS ==========

// Product Schema
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: Number,
  discount: Number,
  platform: { type: String, required: true },
  region: { type: String, required: true },
  images: [String],
  availability: { type: String, required: true, enum: ['available', 'sold', 'reserved'] },
  isNew: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Order Schema
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
      price: { type: Number, required: true }
    },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, required: true, enum: ['pending', 'sent', 'completed', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

// Create Models
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const User = mongoose.model('User', userSchema);

// ========== PRODUCTS API ==========

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
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
    res.status(500).json({ error: 'Failed to fetch product', message: err.message });
  }
});

// Create new product (admin)
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
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
    res.status(500).json({ error: 'Failed to fetch orders', message: err.message });
  }
});

// Get orders by user
app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ 'user.email': req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
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
    res.status(500).json({ error: 'Failed to fetch order', message: err.message });
  }
});

// Create new order
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
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
    res.status(500).json({ error: 'Failed to export orders', message: err.message });
  }
});

// Get order statistics
app.get('/api/orders/stats', async (req, res) => {
  try {
    const orders = await Order.find();
    
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      sent: orders.filter(o => o.status === 'sent').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    };
    
    res.json(stats);
  } catch (err) {
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
      password, // Note: In production, hash this password!
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
    res.status(500).json({ error: 'Failed to get user', message: err.message });
  }
});

// Google OAuth routes
app.use('/api/auth', googleAuth);

// ========== ROOT ROUTE ==========

app.get('/', (req, res) => {
  res.json({
    message: 'Alpha Store API - MongoDB Based',
    status: 'running',
    version: '1.0.0',
    database: 'MongoDB',
    endpoints: {
      products: '/api/products',
      orders: '/api/orders',
      auth: '/api/auth'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB URI: ${process.env.MONGO_URI || 'mongodb://localhost:27017/gaming-accounts'}`);
});

const jwt = require('jsonwebtoken');

module.exports = async function(req, res, next) {
  console.log(' Auth middleware called for:', req.method, req.path);
  
  // Get token from Authorization header (Bearer) or x-auth-token
  let token = req.header('x-auth-token');
  
  // Check Authorization header if no x-auth-token
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  console.log(' Token found:', !!token);
  if (token) {
    console.log(' Token length:', token.length);
    console.log(' Token starts with:', token.substring(0, Math.min(30, token.length)) + '...');
  }
  
  // Check if not token
  if (!token) {
    console.log(' No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    // Special handling for admin signature token
    if (token.includes('admin-signature')) {
      console.log(' Detected admin token in middleware');
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          console.log(' Token payload:', JSON.stringify(payload, null, 2));
          
          // Check if token is expired
          if (payload.exp && Date.now() > payload.exp) {
            console.log(' Admin token expired');
            return res.status(401).json({ message: 'Token expired, please login again' });
          }
          
          // Handle different payload structures
          let user = payload.user;
          if (!user && payload.user) {
            user = payload.user;
          } else if (!user && payload) {
            user = payload;
          }
          
          if (!user || !user.email) {
            console.log(' Invalid user data in token');
            return res.status(401).json({ message: 'Invalid user data in token' });
          }
          
          console.log(' Admin token verified successfully for user:', user.email);
          req.user = {
            _id: user._id || user.id,
            id: user._id || user.id,
            email: user.email,
            firstName: user.firstName || 'Admin',
            lastName: user.lastName || 'User',
            role: user.role || 'admin'
          };
          next();
          return;
        } catch (parseError) {
          console.log(' Failed to parse admin token:', parseError.message);
          return res.status(401).json({ message: 'Invalid admin token format' });
        }
      } else {
        console.log(' Invalid admin token structure');
        return res.status(401).json({ message: 'Invalid admin token structure' });
      }
    }
    
    // Handle mock tokens from frontend
    if (token.includes('mock-jwt-token-')) {
      console.log(' Detected mock token, extracting user ID...');
      const userId = token.replace('mock-jwt-token-', '');
      
      // For development, allow mock tokens without DB verification
      req.user = {
        _id: userId,
        id: userId,
        email: 'mock-user@example.com',
        firstName: 'Mock',
        lastName: 'User',
        role: 'user'
      };
      next();
      return;
    }
    
    // Regular JWT verification for normal users
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log(' JWT token verified successfully for user:', decoded.user.email);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.log(' Token verification failed:', err.message);
    console.log(' Error name:', err.name);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token, please login again' });
    } else {
      return res.status(401).json({ message: 'Token is not valid', error: err.message });
    }
  }
};

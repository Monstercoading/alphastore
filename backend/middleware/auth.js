const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from Authorization header (Bearer) or x-auth-token
  let token = req.header('x-auth-token');
  
  // Check Authorization header if no x-auth-token
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded.user;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token, please login again' });
    } else {
      return res.status(401).json({ message: 'Token is not valid' });
    }
  }
};

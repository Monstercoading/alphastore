const express = require('express');
const router = express.Router();

// Test endpoint for Server Status Dashboard
router.get('/', (req, res) => {
  res.json({ 
    message: 'Users API is working',
    endpoint: '/api/users',
    note: 'Basic users endpoint - functionality can be extended',
    status: 'Active'
  });
});

module.exports = router;

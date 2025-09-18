// Test server startup
console.log('🚀 Starting test server...');

// Check Node.js version
console.log('Node.js version:', process.version);

// Test basic Express
try {
    const express = require('express');
    console.log('✅ Express loaded successfully');
    
    const app = express();
    const PORT = 5000;
    
    // Test route
    app.get('/', (req, res) => {
        res.send('Server is working!');
    });
    
    // Admin redirect routes
    app.get('/admin', (req, res) => {
        res.redirect('/admin/dashboard.html');
    });
    
    app.get('/a', (req, res) => {
        res.redirect('/admin/dashboard.html');
    });
    
    // Serve static files
    const path = require('path');
    app.use(express.static(path.join(__dirname, 'client')));
    
    app.listen(PORT, () => {
        console.log(`✅ Test server running on http://localhost:${PORT}`);
        console.log(`🔗 Admin access: http://localhost:${PORT}/admin`);
        console.log(`🔗 Short admin: http://localhost:${PORT}/a`);
    });
    
} catch (error) {
    console.error('❌ Error starting server:', error);
}

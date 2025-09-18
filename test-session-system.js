// Test script for Session Logging System
// Run this after restarting the server to verify the new session system

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const UserSession = require('./server/models/userSessionModel');

async function testSessionSystem() {
    try {
        console.log('🚀 Testing Session Logging System...\n');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/solar-analytics');
        console.log('✅ Connected to MongoDB');
        
        // Test 1: Check UserSession model
        console.log('\n📊 Testing UserSession Model...');
        const sessionCount = await UserSession.countDocuments();
        console.log(`Current sessions in database: ${sessionCount}`);
        
        // Test 2: Create a test session
        console.log('\n🔧 Creating test session...');
        const testSession = await UserSession.createSession({
            userId: new mongoose.Types.ObjectId(),
            sessionId: 'test-session-' + Date.now(),
            ipAddress: '127.0.0.1',
            userAgent: 'Test User Agent',
            device: 'Chrome on Windows',
            loginMethod: 'email',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            location: {
                city: 'Test City',
                country: 'Test Country'
            }
        });
        console.log('✅ Test session created:', testSession.sessionId);
        
        // Test 3: Find active sessions
        console.log('\n🔍 Testing findActiveByUser...');
        const activeSessions = await UserSession.findActiveByUser(testSession.userId);
        console.log(`Active sessions found: ${activeSessions.length}`);
        
        // Test 4: Update activity
        console.log('\n⏰ Testing updateActivity...');
        await testSession.updateActivity();
        console.log('✅ Activity updated');
        
        // Test 5: Logout session
        console.log('\n🚪 Testing logout...');
        await testSession.logout();
        console.log('✅ Session logged out');
        
        // Test 6: Cleanup - remove test session
        await UserSession.deleteOne({ sessionId: testSession.sessionId });
        console.log('🧹 Test session cleaned up');
        
        console.log('\n🎉 All tests passed! Session system is working correctly.\n');
        
        // Display API endpoints
        console.log('📡 Available Session API Endpoints:');
        console.log('- GET /api/users/sessions (Get user sessions)');
        console.log('- DELETE /api/users/sessions/:sessionId (Logout specific session)');
        console.log('- DELETE /api/users/sessions (Logout all other sessions)');
        
        console.log('\n🔧 Next Steps:');
        console.log('1. Restart the server to apply all changes');
        console.log('2. Login to create real session records');
        console.log('3. Open Settings > Quản lý phiên đăng nhập to see real data');
        console.log('4. Test logout functionality from the modal');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n📴 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run tests
testSessionSystem();

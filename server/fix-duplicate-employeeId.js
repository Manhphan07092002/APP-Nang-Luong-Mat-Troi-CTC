const mongoose = require('mongoose');

async function fixDuplicateEmployeeId() {
    try {
        // Kết nối MongoDB
        await mongoose.connect('mongodb://localhost:27017/solaranalytics');
        console.log('Đã kết nối MongoDB');

        const db = mongoose.connection.db;
        
        // Xóa tất cả employeeId rỗng
        const result1 = await db.collection('users').updateMany(
            { employeeId: '' }, 
            { $unset: { employeeId: 1 } }
        );
        console.log(`Đã xóa ${result1.modifiedCount} employeeId rỗng`);

        // Xóa index cũ nếu tồn tại
        try {
            await db.collection('users').dropIndex('employeeId_1');
            console.log('Đã xóa index cũ');
        } catch (e) {
            console.log('Index không tồn tại hoặc đã bị xóa');
        }

        // Tạo lại index với sparse: true
        await db.collection('users').createIndex(
            { employeeId: 1 }, 
            { unique: true, sparse: true }
        );
        console.log('Đã tạo lại index với sparse: true');

        console.log('Hoàn thành sửa lỗi duplicate employeeId');
        
    } catch (error) {
        console.error('Lỗi:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

fixDuplicateEmployeeId();

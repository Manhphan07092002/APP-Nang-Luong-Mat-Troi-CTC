// test-contact-api.js
const fetch = require('node-fetch');

// URL của máy chủ API (đảm bảo máy chủ đang chạy trên cổng này)
const API_URL = 'http://localhost:5000/api/contact';

// Dữ liệu mẫu để gửi
const testData = {
    name: 'Tester', // Tên người gửi
    email: 'tester@example.com', // Email
    phone: '0123456789', // Số điện thoại
    message: 'Đây là một tin nhắn kiểm thử tự động.' // Nội dung tin nhắn
};

// Hàm thực hiện kiểm thử
async function runContactTest() {
    console.log('Bắt đầu kiểm thử API liên hệ...');
    console.log(`Gửi dữ liệu đến: ${API_URL}`);
    console.log('Dữ liệu gửi đi:', JSON.stringify(testData, null, 2));

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData),
        });

        const result = await response.json();

        console.log(`\n--- KẾT QUẢ NHẬN ĐƯỢC ---`);
        console.log(`Mã trạng thái: ${response.status}`);
        console.log('Nội dung phản hồi:', result);

        // Kiểm tra kết quả
        if (response.status === 200 && result.message === 'Yêu cầu của bạn đã được gửi thành công!') {
            console.log('\n\u001b[32m✅ KIỂM THỬ THÀNH CÔNG: API đã xử lý yêu cầu liên hệ chính xác.\u001b[0m');
        } else {
            console.error('\n\u001b[31m❌ KIỂM THỬ THẤT BẠI: Phản hồi từ API không như mong đợi.\u001b[0m');
            console.error('Mong đợi mã trạng thái 200 và thông điệp thành công.');
        }

    } catch (error) {
        console.error('\n\u001b[31m❌ LỖI KIỂM THỬ: Không thể kết nối đến máy chủ API.\u001b[0m');
        console.error('Chi tiết lỗi:', error.message);
        console.error('Vui lòng đảm bảo máy chủ của bạn đang chạy và có thể truy cập tại', API_URL);
    }
}

// Chạy kiểm thử
runContactTest();

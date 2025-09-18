document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessageDiv = document.getElementById('error-message');
    const errorTextSpan = document.getElementById('error-text');
    const submitBtn = document.getElementById('submit-btn');

    // Validate required elements exist
    if (!loginForm || !errorMessageDiv || !errorTextSpan || !submitBtn) {
        console.error('Required login form elements not found');
        return;
    }

    // Chuyển hướng nếu người dùng đã đăng nhập
    try {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const userData = JSON.parse(userInfo);
            if (userData && userData.token) {
                window.location.href = '/dashboard.html';
                return;
            }
        }
    } catch (error) {
        console.error('Error checking existing login:', error);
        localStorage.removeItem('userInfo');
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Vô hiệu hóa nút bấm và ẩn thông báo lỗi cũ
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang xử lý...';
        errorMessageDiv.classList.add('hidden');

        const emailEl = document.getElementById('email');
        const passwordEl = document.getElementById('password');
        
        if (!emailEl || !passwordEl) {
            throw new Error('Không tìm thấy trường email hoặc mật khẩu');
        }
        
        const email = emailEl.value;
        const password = passwordEl.value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
            }

            // Debug: Log response data
            console.log('Login response data:', data);
            console.log('Token value:', data.token);
            console.log('Token type:', typeof data.token);

            // Kiểm tra vai trò và lưu thông tin phù hợp
            if (data.role === 'admin') {
                // Admin user - kiểm tra token trước khi lưu
                if (!data.token) {
                    throw new Error('Token không được trả về từ server');
                }
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminInfo', JSON.stringify(data)); // Lưu toàn bộ thông tin admin
                
                // Debug: Verify token was saved
                console.log('Saved adminToken:', localStorage.getItem('adminToken'));
                
                window.location.href = '/admin/dashboard.html';
            } else {
                // Regular user
                localStorage.setItem('token', data.token); // Lưu token cho user thường
                localStorage.setItem('userInfo', JSON.stringify(data));
                window.location.href = '/dashboard.html';
            }

        } catch (error) {
            // Hiển thị thông báo lỗi
            errorTextSpan.textContent = error.message;
            errorMessageDiv.classList.remove('hidden');
        } finally {
            // Kích hoạt lại nút bấm
            submitBtn.disabled = false;
            submitBtn.textContent = 'Đăng Nhập';
        }
    });
});
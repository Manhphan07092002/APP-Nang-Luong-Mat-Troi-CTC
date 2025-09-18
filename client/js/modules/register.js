document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorMessageDiv = document.getElementById('error-message');
    const errorTextSpan = document.getElementById('error-text');
    const submitBtn = document.getElementById('submit-btn');

    // Chuyển hướng nếu người dùng đã đăng nhập
    if (localStorage.getItem('userInfo')) {
        window.location.href = '/dashboard.html';
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang xử lý...';
        errorMessageDiv.classList.add('hidden');

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (password.length < 6) {
            errorTextSpan.textContent = "Mật khẩu phải có ít nhất 6 ký tự.";
            errorMessageDiv.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Đăng Ký';
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Đăng ký thất bại. Vui lòng thử lại.');
            }

            // Đăng ký thành công, tự động đăng nhập
            localStorage.setItem('userInfo', JSON.stringify(data));
            
            // Chuyển hướng đến trang dashboard
            window.location.href = '/dashboard.html';

        } catch (error) {
            errorTextSpan.textContent = error.message;
            errorMessageDiv.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Đăng Ký';
        }
    });
});
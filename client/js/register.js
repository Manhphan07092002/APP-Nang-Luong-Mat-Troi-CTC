document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorMessageDiv = document.getElementById('error-message');
    const errorTextSpan = document.getElementById('error-text');
    const submitBtn = document.getElementById('submit-btn');

    // Validate required elements exist
    if (!registerForm || !errorMessageDiv || !errorTextSpan || !submitBtn) {
        console.error('Required register form elements not found');
        return;
    }

    // ===== PHẦN MỚI: Lấy các element cho việc ẩn/hiện mật khẩu =====
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const eyeIconPassword = document.getElementById('eye-icon-password');
    const eyeSlashIconPassword = document.getElementById('eye-slash-icon-password');

    const confirmPasswordInput = document.getElementById('confirm-password');
    const toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-password');
    const eyeIconConfirm = document.getElementById('eye-icon-confirm');
    const eyeSlashIconConfirm = document.getElementById('eye-slash-icon-confirm');
    // =============================================================

    /**
     * Hàm thiết lập chức năng ẩn/hiện mật khẩu cho một trường input
     * @param {HTMLInputElement} inputEl - Element input của mật khẩu
     * @param {HTMLButtonElement} toggleBtnEl - Element button để click
     * @param {SVGElement} eyeIconEl - Element icon mắt mở
     * @param {SVGElement} eyeSlashIconEl - Element icon mắt gạch chéo
     */
    function setupPasswordToggle(inputEl, toggleBtnEl, eyeIconEl, eyeSlashIconEl) {
        toggleBtnEl.addEventListener('click', () => {
            // Kiểm tra type hiện tại của input
            const isPassword = inputEl.type === 'password';

            // Thay đổi type và icon tương ứng
            if (isPassword) {
                inputEl.type = 'text';
                eyeIconEl.classList.add('hidden');
                eyeSlashIconEl.classList.remove('hidden');
            } else {
                inputEl.type = 'password';
                eyeIconEl.classList.remove('hidden');
                eyeSlashIconEl.classList.add('hidden');
            }
        });
    }

    // ===== PHẦN MỚI: Gọi hàm thiết lập cho cả 2 trường mật khẩu =====
    if (passwordInput && togglePasswordBtn && eyeIconPassword && eyeSlashIconPassword) {
        setupPasswordToggle(passwordInput, togglePasswordBtn, eyeIconPassword, eyeSlashIconPassword);
    }
    if (confirmPasswordInput && toggleConfirmPasswordBtn && eyeIconConfirm && eyeSlashIconConfirm) {
        setupPasswordToggle(confirmPasswordInput, toggleConfirmPasswordBtn, eyeIconConfirm, eyeSlashIconConfirm);
    }
    // =================================================================

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang xử lý...';
        errorMessageDiv.classList.add('hidden');

        // Lấy dữ liệu từ form với validation
        const nameEl = document.getElementById('name');
        const emailEl = document.getElementById('email');
        const phoneEl = document.getElementById('phone');
        const addressEl = document.getElementById('address');
        const employeeIdEl = document.getElementById('employeeId');
        
        if (!nameEl || !emailEl || !passwordInput || !confirmPasswordInput) {
            showError('Không tìm thấy các trường bắt buộc');
            return;
        }
        
        const name = nameEl.value;
        const email = emailEl.value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const phone = phoneEl ? phoneEl.value : '';
        const address = addressEl ? addressEl.value : '';
        const employeeId = employeeIdEl ? employeeIdEl.value : '';
        
        // --- LOGIC VALIDATION MỚI ---
        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

        if (name.length < 10) {
            showError("Họ và Tên phải có ít nhất 10 ký tự.");
            return;
        }
        if (password.length < 10) {
            showError("Mật khẩu phải có ít nhất 10 ký tự.");
            return;
        }
        if (!specialCharRegex.test(password)) {
            showError("Mật khẩu phải chứa ít nhất một ký tự đặc biệt.");
            return;
        }
        if (password !== confirmPassword) {
            showError("Mật khẩu nhập lại không khớp.");
            return;
        }
        // --- KẾT THÚC VALIDATION ---

        const formData = { name, email, password, phone, address, employeeId };

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Đăng ký thất bại.');
            }
            
            localStorage.setItem('userInfo', JSON.stringify(data));
            window.location.href = '/dashboard.html';

        } catch (error) {
            showError(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Đăng Ký';
        }
    });

    /**
     * Hàm tiện ích để hiển thị thông báo lỗi
     * @param {string} message - Nội dung lỗi cần hiển thị
     */
    function showError(message) {
        errorTextSpan.textContent = message;
        errorMessageDiv.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Đăng Ký';
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const adminToken = localStorage.getItem('adminToken');
    const adminInfo = localStorage.getItem('adminInfo');

    // Lấy đường dẫn hiện tại, loại bỏ query string
    const currentPage = window.location.pathname;

    if (!adminToken || !adminInfo) {
        console.error('Authentication required. Redirecting to login.');
        // Lưu lại trang hiện tại để chuyển hướng sau khi đăng nhập thành công
        localStorage.setItem('redirectAfterLogin', currentPage);
        // Chuyển hướng về trang đăng nhập
        window.location.href = 'login.html';
        return; // Dừng thực thi script
    }

    try {
        const parsedAdminInfo = JSON.parse(adminInfo);
        if (parsedAdminInfo.role !== 'admin') {
            console.error('Access denied. User is not an admin. Redirecting to home.');
            alert('Bạn không có quyền truy cập vào trang quản trị.');
            window.location.href = '/'; // Chuyển hướng về trang chủ
        }
    } catch (error) {
        console.error('Failed to parse admin info. Redirecting to login.', error);
        localStorage.setItem('redirectAfterLogin', currentPage);
        window.location.href = 'login.html';
    }
});

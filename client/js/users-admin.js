document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        console.error('Không tìm thấy token xác thực của admin.');
        // Chuyển hướng đến trang đăng nhập nếu cần
        // window.location.href = 'login.html'; 
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const usersTableBody = document.getElementById('users-table-body');
    const userModal = new bootstrap.Modal(document.getElementById('userModal'));
    const userForm = document.getElementById('user-form');
    const userModalLabel = document.getElementById('userModalLabel');
    const saveUserBtn = document.getElementById('save-user-btn');

    const fetchUsers = async () => {
        if (!usersTableBody) return;
        usersTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Đang tải dữ liệu...</td></tr>';

        try {
            const response = await fetch('/api/admin/users', { headers });
            if (!response.ok) {
                throw new Error(`Lỗi HTTP: ${response.status}`);
            }
            const data = await response.json();

            renderUsers(data.users);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách người dùng:', error);
            usersTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Không thể tải dữ liệu người dùng.</td></tr>';
        }
    };

    const renderUsers = (users) => {
        usersTableBody.innerHTML = ''; // Xóa nội dung cũ
        if (users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Không có người dùng nào.</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="badge ${user.role === 'admin' ? 'bg-success' : 'bg-secondary'}">${user.role}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-primary me-2" onclick="editUser('${user._id}')"><i class="fas fa-edit"></i> Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')"><i class="fas fa-trash"></i> Xóa</button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
    };

    const resetForm = () => {
        userForm.reset();
        document.getElementById('userId').value = '';
        document.getElementById('userPassword').setAttribute('placeholder', 'Nhập mật khẩu mới');
    };

    document.querySelector('[data-bs-target="#userModal"]').addEventListener('click', () => {
        resetForm();
        userModalLabel.textContent = 'Thêm Người dùng';
    });

    saveUserBtn.addEventListener('click', async () => {
        const userId = document.getElementById('userId').value;
        const name = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        const role = document.getElementById('userRole').value;

        const userData = { name, email, role };
        if (password) {
            userData.password = password;
        }

        const url = userId ? `/api/admin/users/${userId}` : '/api/admin/users';
        const method = userId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Thao tác thất bại');
            }

            userModal.hide();
            fetchUsers(); // Tải lại danh sách
        } catch (error) {
            console.error('Lỗi khi lưu người dùng:', error);
            alert(`Lỗi: ${error.message}`);
        }
    });

    window.editUser = async (userId) => {
        resetForm();
        userModalLabel.textContent = 'Chỉnh sửa Người dùng';

        try {
            const response = await fetch(`/api/admin/users/${userId}`, { headers });
            if (!response.ok) throw new Error('Không thể lấy thông tin người dùng');
            const user = await response.json();

            document.getElementById('userId').value = user._id;
            document.getElementById('userName').value = user.name;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userRole').value = user.role;
            document.getElementById('userPassword').setAttribute('placeholder', 'Để trống nếu không đổi');

            userModal.show();
        } catch (error) {
            console.error('Lỗi khi sửa người dùng:', error);
        }
    };

    window.deleteUser = async (userId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: headers
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Xóa thất bại');
            }

            fetchUsers(); // Tải lại danh sách
        } catch (error) {
            console.error('Lỗi khi xóa người dùng:', error);
            alert(`Lỗi: ${error.message}`);
        }
    };

    // Tải dữ liệu khi trang được mở
    fetchUsers();
});

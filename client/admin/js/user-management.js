// User Management JavaScript
const API_BASE = window.location.origin;
let currentUsers = [];
let filteredUsers = [];
let currentPage = 1;
const usersPerPage = 10;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserStats();
    loadUsers();
    
    // Add event listeners
    document.getElementById('searchInput').addEventListener('input', debounce(searchUsers, 300));
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load user statistics
async function loadUserStats() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/users/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const stats = await response.json();
            document.getElementById('totalUsers').textContent = stats.total || 0;
            document.getElementById('activeUsers').textContent = stats.active || 0;
            document.getElementById('newUsersToday').textContent = stats.newToday || 0;
            document.getElementById('adminUsers').textContent = stats.admins || 0;
        } else {
            // Fallback to mock data
            document.getElementById('totalUsers').textContent = '0';
            document.getElementById('activeUsers').textContent = '0';
            document.getElementById('newUsersToday').textContent = '0';
            document.getElementById('adminUsers').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
        // Set fallback values
        document.getElementById('totalUsers').textContent = '0';
        document.getElementById('activeUsers').textContent = '0';
        document.getElementById('newUsersToday').textContent = '0';
        document.getElementById('adminUsers').textContent = '0';
    }
}

// Load users
async function loadUsers() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/api/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const users = await response.json();
            currentUsers = users;
            filteredUsers = [...users];
            displayUsers();
            updatePagination();
        } else if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Không thể tải danh sách người dùng');
        
        // Load mock data for demo
        loadMockUsers();
    }
}

// Load mock users for demo
function loadMockUsers() {
    const mockUsers = [
        {
            _id: '1',
            name: 'Nguyễn Văn Admin',
            email: 'admin@example.com',
            phone: '0123456789',
            role: 'admin',
            company: 'Solar Analytics',
            position: 'System Administrator',
            address: 'Hà Nội, Việt Nam',
            bio: 'Quản trị viên hệ thống',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            profileImage: 'https://ui-avatars.com/api/?name=Admin&background=667eea&color=fff',
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            lastLogin: new Date().toISOString(),
            stats: {
                projectsCompleted: 15,
                reportsGenerated: 25,
                experienceYears: 5,
                achievementsEarned: 8
            }
        },
        {
            _id: '2',
            name: 'Trần Thị User',
            email: 'user@example.com',
            phone: '0987654321',
            role: 'user',
            company: 'Green Energy Co.',
            position: 'Energy Analyst',
            address: 'TP.HCM, Việt Nam',
            bio: 'Chuyên gia phân tích năng lượng',
            dateOfBirth: '1995-05-15',
            gender: 'female',
            profileImage: 'https://ui-avatars.com/api/?name=User&background=4facfe&color=fff',
            isActive: true,
            createdAt: '2024-02-15T00:00:00.000Z',
            lastLogin: new Date(Date.now() - 86400000).toISOString(),
            stats: {
                projectsCompleted: 8,
                reportsGenerated: 12,
                experienceYears: 3,
                achievementsEarned: 5
            }
        }
    ];
    
    currentUsers = mockUsers;
    filteredUsers = [...mockUsers];
    displayUsers();
    updatePagination();
}

// Show loading state
function showLoading() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
            </td>
        </tr>
    `;
}

// Show error message
function showError(message) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4 text-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>${message}
            </td>
        </tr>
    `;
}

// Display users in table
function displayUsers() {
    const tbody = document.getElementById('usersTableBody');
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const usersToShow = filteredUsers.slice(startIndex, endIndex);

    if (usersToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="fas fa-users-slash me-2"></i>Không tìm thấy người dùng nào
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = usersToShow.map(user => `
        <tr>
            <td>
                <img src="${user.profileImage || generateAvatarUrl(user.name)}" 
                     alt="Avatar" class="user-avatar" 
                     onerror="this.src='${generateAvatarUrl(user.name)}'">
            </td>
            <td>
                <div>
                    <strong>${user.name}</strong>
                    <br>
                    <small class="text-muted">${user.email}</small>
                </div>
            </td>
            <td>
                <div>
                    ${user.phone || '<span class="text-muted">Chưa có</span>'}
                    <br>
                    <small class="text-muted">${user.company || 'Chưa có'}</small>
                </div>
            </td>
            <td>
                <span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">
                    ${user.role === 'admin' ? 'Admin' : 'User'}
                </span>
            </td>
            <td>
                <span class="badge status-badge ${user.isActive ? 'bg-success' : 'bg-secondary'}">
                    ${user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </span>
            </td>
            <td>
                <small>${formatDate(user.lastLogin) || 'Chưa đăng nhập'}</small>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewUser('${user._id}')" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="editUser('${user._id}')" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user._id}')" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Generate avatar URL
function generateAvatarUrl(name) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=667eea&color=fff&size=50`;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Trước</a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Sau</a>
        </li>
    `;
    
    pagination.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayUsers();
    updatePagination();
}

// Search users
function searchUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredUsers = [...currentUsers];
    } else {
        filteredUsers = currentUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            (user.phone && user.phone.includes(searchTerm)) ||
            (user.company && user.company.toLowerCase().includes(searchTerm))
        );
    }
    
    currentPage = 1;
    displayUsers();
    updatePagination();
}

// Filter users
function filterUsers() {
    const roleFilter = document.getElementById('roleFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    filteredUsers = currentUsers.filter(user => {
        const matchesSearch = !searchTerm || 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            (user.phone && user.phone.includes(searchTerm)) ||
            (user.company && user.company.toLowerCase().includes(searchTerm));
            
        const matchesRole = !roleFilter || user.role === roleFilter;
        const matchesStatus = !statusFilter || 
            (statusFilter === 'active' && user.isActive) ||
            (statusFilter === 'inactive' && !user.isActive);
            
        return matchesSearch && matchesRole && matchesStatus;
    });
    
    currentPage = 1;
    displayUsers();
    updatePagination();
}

// Sort users
function sortUsers() {
    const sortBy = document.getElementById('sortBy').value;
    
    filteredUsers.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'lastLogin':
                return new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0);
            case 'createdAt':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });
    
    displayUsers();
}

// Refresh users
function refreshUsers() {
    loadUsers();
    loadUserStats();
    
    // Reset filters
    document.getElementById('searchInput').value = '';
    document.getElementById('roleFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('sortBy').value = 'createdAt';
    
    currentPage = 1;
}

// View user details
function viewUser(userId) {
    const user = currentUsers.find(u => u._id === userId);
    if (!user) return;

    // Populate view modal
    document.getElementById('viewUserAvatar').src = user.profileImage || generateAvatarUrl(user.name);
    document.getElementById('viewUserName').textContent = user.name;
    document.getElementById('viewUserRole').textContent = user.role === 'admin' ? 'Quản trị viên' : 'Người dùng';
    document.getElementById('viewUserEmail').textContent = user.email;
    document.getElementById('viewUserPhone').textContent = user.phone || 'Chưa có';
    document.getElementById('viewUserCompany').textContent = user.company || 'Chưa có';
    document.getElementById('viewUserPosition').textContent = user.position || 'Chưa có';
    document.getElementById('viewUserAddress').textContent = user.address || 'Chưa có';
    document.getElementById('viewUserDateOfBirth').textContent = user.dateOfBirth ? 
        new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa có';
    document.getElementById('viewUserGender').textContent = getGenderText(user.gender);
    document.getElementById('viewUserCreatedAt').textContent = formatDate(user.createdAt);
    document.getElementById('viewUserLastLogin').textContent = formatDate(user.lastLogin) || 'Chưa đăng nhập';
    document.getElementById('viewUserBio').textContent = user.bio || 'Chưa có thông tin';

    // Show modal
    new bootstrap.Modal(document.getElementById('viewUserModal')).show();
}

// Edit user from view modal
function editUserFromView() {
    bootstrap.Modal.getInstance(document.getElementById('viewUserModal')).hide();
    const userId = currentUsers.find(u => u.name === document.getElementById('viewUserName').textContent)?._id;
    if (userId) {
        setTimeout(() => editUser(userId), 300);
    }
}

// Edit user
function editUser(userId) {
    const user = currentUsers.find(u => u._id === userId);
    if (!user) return;

    // Populate edit modal
    document.getElementById('editUserId').value = user._id;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserPhone').value = user.phone || '';
    document.getElementById('editUserRole').value = user.role;
    document.getElementById('editUserCompany').value = user.company || '';
    document.getElementById('editUserPosition').value = user.position || '';
    document.getElementById('editUserAddress').value = user.address || '';
    document.getElementById('editUserBio').value = user.bio || '';
    document.getElementById('editUserDateOfBirth').value = user.dateOfBirth ? 
        user.dateOfBirth.split('T')[0] : '';
    document.getElementById('editUserGender').value = user.gender || '';
    document.getElementById('editUserActive').checked = user.isActive;

    // Show modal
    new bootstrap.Modal(document.getElementById('editUserModal')).show();
}

// Update user
async function updateUser() {
    const userId = document.getElementById('editUserId').value;
    const userData = {
        name: document.getElementById('editUserName').value.trim(),
        phone: document.getElementById('editUserPhone').value.trim(),
        role: document.getElementById('editUserRole').value,
        company: document.getElementById('editUserCompany').value.trim(),
        position: document.getElementById('editUserPosition').value.trim(),
        address: document.getElementById('editUserAddress').value.trim(),
        bio: document.getElementById('editUserBio').value.trim(),
        dateOfBirth: document.getElementById('editUserDateOfBirth').value,
        gender: document.getElementById('editUserGender').value,
        isActive: document.getElementById('editUserActive').checked
    };

    // Validation
    if (!userData.name) {
        showNotification('Họ và tên là bắt buộc', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            showNotification('Cập nhật thông tin người dùng thành công', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
            loadUsers();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Có lỗi xảy ra khi cập nhật', 'error');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        showNotification('Không thể cập nhật thông tin người dùng', 'error');
    }
}

// Add new user
async function addUser() {
    const userData = {
        name: document.getElementById('addUserName').value.trim(),
        email: document.getElementById('addUserEmail').value.trim(),
        phone: document.getElementById('addUserPhone').value.trim(),
        role: document.getElementById('addUserRole').value,
        password: document.getElementById('addUserPassword').value,
        company: document.getElementById('addUserCompany').value.trim(),
        position: document.getElementById('addUserPosition').value.trim()
    };

    // Validation
    if (!userData.name || !userData.email || !userData.password) {
        showNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
        return;
    }

    if (userData.password !== document.getElementById('addUserConfirmPassword').value) {
        showNotification('Mật khẩu xác nhận không khớp', 'error');
        return;
    }

    if (userData.password.length < 6) {
        showNotification('Mật khẩu phải có ít nhất 6 ký tự', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            showNotification('Thêm người dùng mới thành công', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
            document.getElementById('addUserForm').reset();
            loadUsers();
            loadUserStats();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Có lỗi xảy ra khi thêm người dùng', 'error');
        }
    } catch (error) {
        console.error('Error adding user:', error);
        showNotification('Không thể thêm người dùng mới', 'error');
    }
}

// Delete user
function deleteUser(userId) {
    const user = currentUsers.find(u => u._id === userId);
    if (!user) return;

    if (confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.name}"?\n\nHành động này không thể hoàn tác.`)) {
        performDeleteUser(userId);
    }
}

// Perform delete user
async function performDeleteUser(userId) {
    try {
        const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showNotification('Xóa người dùng thành công', 'success');
            loadUsers();
            loadUserStats();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Có lỗi xảy ra khi xóa người dùng', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Không thể xóa người dùng', 'error');
    }
}

// Get gender text
function getGenderText(gender) {
    switch (gender) {
        case 'male': return 'Nam';
        case 'female': return 'Nữ';
        case 'other': return 'Khác';
        default: return 'Chưa có';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Logout
function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = 'login.html';
    }
}

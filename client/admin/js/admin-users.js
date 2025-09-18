// Admin User Management JavaScript
class AdminUserManager {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('token');
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentSearch = '';
        this.currentRole = '';
        this.users = [];
        this.totalPages = 1;
    }

    // Load users with pagination and filters
    async loadUsers(page = 1, search = '', role = '') {
        try {
            this.showLoading(true);
            
            const params = new URLSearchParams({
                page: page,
                limit: this.pageSize,
                search: search,
                role: role
            });

            const response = await fetch(`${this.baseURL}/admin/users?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.users = data.users;
                this.totalPages = data.totalPages;
                this.currentPage = data.currentPage;
                
                this.renderUsersTable();
                this.renderPagination();
            } else {
                throw new Error('Failed to load users');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Lỗi khi tải danh sách người dùng');
        } finally {
            this.showLoading(false);
        }
    }

    // Render users table
    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        
        if (!this.users || this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="fas fa-users fa-2x mb-2"></i>
                        <p>Không có người dùng nào</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="user-avatar me-3">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="fw-semibold">${user.name}</div>
                            <small class="text-muted">${user.employeeId || 'N/A'}</small>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>
                    <span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">
                        ${user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>
                    <span class="badge ${user.role === 'admin' ? 'bg-success' : 'bg-secondary'}">
                        ${user.role === 'admin' ? 'Hoạt động' : 'Bình thường'}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="adminUserManager.viewUser('${user._id}')" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="adminUserManager.editUser('${user._id}')" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="adminUserManager.deleteUser('${user._id}', '${user.name}')" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Render pagination
    renderPagination() {
        const pagination = document.getElementById('usersPagination');
        
        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <nav>
                <ul class="pagination justify-content-center">
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="adminUserManager.loadUsers(${this.currentPage - 1}, '${this.currentSearch}', '${this.currentRole}')">
                            <i class="fas fa-chevron-left"></i>
                        </a>
                    </li>
        `;

        // Show page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="adminUserManager.loadUsers(${i}, '${this.currentSearch}', '${this.currentRole}')">${i}</a>
                </li>
            `;
        }

        paginationHTML += `
                    <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="adminUserManager.loadUsers(${this.currentPage + 1}, '${this.currentSearch}', '${this.currentRole}')">
                            <i class="fas fa-chevron-right"></i>
                        </a>
                    </li>
                </ul>
            </nav>
        `;

        pagination.innerHTML = paginationHTML;
    }

    // Search and filter
    searchUsers() {
        const searchInput = document.getElementById('userSearch');
        const roleFilter = document.getElementById('roleFilter');
        
        this.currentSearch = searchInput.value.trim();
        this.currentRole = roleFilter.value;
        
        this.loadUsers(1, this.currentSearch, this.currentRole);
    }

    // Create new user
    showCreateUserModal() {
        document.getElementById('userModalTitle').textContent = 'Thêm người dùng mới';
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
        document.getElementById('passwordGroup').style.display = 'block';
        document.getElementById('password').required = true;
        
        const modal = new bootstrap.Modal(document.getElementById('userModal'));
        modal.show();
    }

    // Edit user
    async editUser(userId) {
        try {
            const response = await fetch(`${this.baseURL}/admin/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const user = data.user;
                
                document.getElementById('userModalTitle').textContent = 'Chỉnh sửa người dùng';
                document.getElementById('userId').value = user._id;
                document.getElementById('name').value = user.name;
                document.getElementById('email').value = user.email;
                document.getElementById('phone').value = user.phone;
                document.getElementById('address').value = user.address || '';
                document.getElementById('employeeId').value = user.employeeId || '';
                document.getElementById('role').value = user.role;
                
                // Hide password field for editing
                document.getElementById('passwordGroup').style.display = 'none';
                document.getElementById('password').required = false;
                
                const modal = new bootstrap.Modal(document.getElementById('userModal'));
                modal.show();
            } else {
                throw new Error('Failed to load user details');
            }
        } catch (error) {
            console.error('Error loading user:', error);
            this.showError('Lỗi khi tải thông tin người dùng');
        }
    }

    // View user details
    async viewUser(userId) {
        try {
            const response = await fetch(`${this.baseURL}/admin/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.showUserDetailsModal(data);
            } else {
                throw new Error('Failed to load user details');
            }
        } catch (error) {
            console.error('Error loading user details:', error);
            this.showError('Lỗi khi tải chi tiết người dùng');
        }
    }

    // Show user details modal
    showUserDetailsModal(data) {
        const { user, reportCount, recentReports } = data;
        
        const modalHTML = `
            <div class="modal fade" id="userDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Chi tiết người dùng</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-4 text-center">
                                    <div class="user-avatar mx-auto mb-3" style="width: 80px; height: 80px; font-size: 32px;">
                                        ${user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <h5>${user.name}</h5>
                                    <span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'} mb-3">
                                        ${user.role === 'admin' ? 'Admin' : 'User'}
                                    </span>
                                </div>
                                <div class="col-md-8">
                                    <table class="table table-borderless">
                                        <tr>
                                            <td><strong>Email:</strong></td>
                                            <td>${user.email}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Điện thoại:</strong></td>
                                            <td>${user.phone}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Địa chỉ:</strong></td>
                                            <td>${user.address || 'Chưa cập nhật'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Mã nhân viên:</strong></td>
                                            <td>${user.employeeId || 'Chưa có'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Ngày tạo:</strong></td>
                                            <td>${new Date(user.createdAt).toLocaleString('vi-VN')}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Số báo cáo:</strong></td>
                                            <td><span class="badge bg-success">${reportCount}</span></td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                            
                            ${recentReports && recentReports.length > 0 ? `
                                <hr>
                                <h6>Báo cáo gần đây</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Tên khách hàng</th>
                                                <th>Ngày tạo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recentReports.map(report => `
                                                <tr>
                                                    <td><code>${report.shareId}</code></td>
                                                    <td>${report.survey?.name || 'N/A'}</td>
                                                    <td>${new Date(report.createdAt).toLocaleDateString('vi-VN')}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : '<p class="text-muted">Chưa có báo cáo nào</p>'}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                            <button type="button" class="btn btn-warning" onclick="adminUserManager.editUser('${user._id}')" data-bs-dismiss="modal">
                                <i class="fas fa-edit me-2"></i>Chỉnh sửa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('userDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
        modal.show();
    }

    // Save user (create or update)
    async saveUser() {
        const form = document.getElementById('userForm');
        const formData = new FormData(form);
        const userId = document.getElementById('userId').value;
        
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            employeeId: formData.get('employeeId'),
            role: formData.get('role')
        };
        
        // Add password for new users
        if (!userId && formData.get('password')) {
            userData.password = formData.get('password');
        }
        
        try {
            const url = userId ? 
                `${this.baseURL}/admin/users/${userId}` : 
                `${this.baseURL}/admin/users`;
            
            const method = userId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
                modal.hide();
                
                this.showSuccess(userId ? 'Cập nhật người dùng thành công' : 'Tạo người dùng thành công');
                this.loadUsers(this.currentPage, this.currentSearch, this.currentRole);
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save user');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            this.showError(error.message || 'Lỗi khi lưu thông tin người dùng');
        }
    }

    // Delete user
    async deleteUser(userId, userName) {
        if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${userName}"?\n\nLưu ý: Tất cả báo cáo của người dùng này cũng sẽ bị xóa.`)) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showSuccess('Xóa người dùng thành công');
                this.loadUsers(this.currentPage, this.currentSearch, this.currentRole);
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showError(error.message || 'Lỗi khi xóa người dùng');
        }
    }

    // Utility functions
    showLoading(show) {
        const loading = document.getElementById('usersLoading');
        const table = document.getElementById('usersTable');
        
        if (show) {
            loading.style.display = 'block';
            table.style.opacity = '0.5';
        } else {
            loading.style.display = 'none';
            table.style.opacity = '1';
        }
    }

    showError(message) {
        const alertHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        const container = document.getElementById('users');
        container.insertAdjacentHTML('afterbegin', alertHTML);
    }

    showSuccess(message) {
        const alertHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        const container = document.getElementById('users');
        container.insertAdjacentHTML('afterbegin', alertHTML);
        
        // Auto dismiss after 3 seconds
        setTimeout(() => {
            const alert = container.querySelector('.alert-success');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 3000);
    }
}

// Initialize user manager
let adminUserManager;

// Function to load users section
function loadUsersSection() {
    if (!adminUserManager) {
        adminUserManager = new AdminUserManager();
    }
    
    // Update users section HTML
    const usersSection = document.getElementById('users');
    usersSection.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-dark">Quản lý Người dùng</h2>
            <button class="btn btn-primary" onclick="adminUserManager.showCreateUserModal()">
                <i class="fas fa-plus me-2"></i>Thêm người dùng
            </button>
        </div>

        <!-- Search and Filter -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                    <input type="text" class="form-control" id="userSearch" placeholder="Tìm kiếm theo tên, email, điện thoại..." onkeyup="if(event.key==='Enter') adminUserManager.searchUsers()">
                </div>
            </div>
            <div class="col-md-3">
                <select class="form-select" id="roleFilter" onchange="adminUserManager.searchUsers()">
                    <option value="">Tất cả vai trò</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div class="col-md-3">
                <button class="btn btn-outline-primary w-100" onclick="adminUserManager.searchUsers()">
                    <i class="fas fa-search me-2"></i>Tìm kiếm
                </button>
            </div>
        </div>

        <!-- Loading -->
        <div class="loading text-center" id="usersLoading" style="display: none;">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Đang tải danh sách người dùng...</p>
        </div>

        <!-- Users Table -->
        <div class="table-container">
            <div class="table-responsive" id="usersTable">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Người dùng</th>
                            <th>Email</th>
                            <th>Điện thoại</th>
                            <th>Vai trò</th>
                            <th>Ngày tạo</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr>
                            <td colspan="7" class="text-center text-muted">Đang tải...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination -->
            <div id="usersPagination" class="mt-3"></div>
        </div>

        <!-- User Modal -->
        <div class="modal fade" id="userModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="userModalTitle">Thêm người dùng mới</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form id="userForm" onsubmit="event.preventDefault(); adminUserManager.saveUser();">
                        <div class="modal-body">
                            <input type="hidden" id="userId">
                            
                            <div class="mb-3">
                                <label for="name" class="form-label">Họ tên *</label>
                                <input type="text" class="form-control" id="name" name="name" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="email" class="form-label">Email *</label>
                                <input type="email" class="form-control" id="email" name="email" required>
                            </div>
                            
                            <div class="mb-3" id="passwordGroup">
                                <label for="password" class="form-label">Mật khẩu *</label>
                                <input type="password" class="form-control" id="password" name="password" minlength="6">
                                <div class="form-text">Tối thiểu 6 ký tự</div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="phone" class="form-label">Điện thoại *</label>
                                <input type="tel" class="form-control" id="phone" name="phone" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="address" class="form-label">Địa chỉ</label>
                                <textarea class="form-control" id="address" name="address" rows="2"></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label for="employeeId" class="form-label">Mã nhân viên</label>
                                <input type="text" class="form-control" id="employeeId" name="employeeId">
                            </div>
                            
                            <div class="mb-3">
                                <label for="role" class="form-label">Vai trò *</label>
                                <select class="form-select" id="role" name="role" required>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save me-2"></i>Lưu
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Load users data
    adminUserManager.loadUsers();
}

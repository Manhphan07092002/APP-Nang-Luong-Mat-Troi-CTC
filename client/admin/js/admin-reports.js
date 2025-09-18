// Admin Report Management JavaScript
class AdminReportManager {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('adminToken');
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentSearch = '';
        this.currentUserId = '';
        this.reports = [];
        this.totalPages = 1;
    }

    // Load reports with pagination and filters
    async loadReports(page = 1, search = '', userId = '') {
        try {
            this.showLoading(true);
            
            const params = new URLSearchParams({
                page: page,
                limit: this.pageSize,
                search: search,
                userId: userId
            });

            const response = await fetch(`${this.baseURL}/admin/reports?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.reports = data.reports;
                this.totalPages = data.totalPages;
                this.currentPage = data.currentPage;
                
                this.renderReportsTable();
                this.renderPagination();
            } else {
                throw new Error('Failed to load reports');
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            this.showError('Lỗi khi tải danh sách báo cáo');
        } finally {
            this.showLoading(false);
        }
    }

    // Render reports table
    renderReportsTable() {
        const tbody = document.getElementById('reportsTableBody');
        
        if (!this.reports || this.reports.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-file-alt fa-2x mb-2"></i>
                        <p>Không có báo cáo nào</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.reports.map(report => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="report-icon me-3">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div>
                            <div class="fw-semibold">${report.survey?.name || 'N/A'}</div>
                            <small class="text-muted">ID: ${report.shareId}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="user-avatar me-2" style="width: 30px; height: 30px; font-size: 12px;">
                            ${report.user?.name ? report.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <div class="fw-semibold">${report.user?.name || 'Unknown'}</div>
                            <small class="text-muted">${report.user?.email || 'N/A'}</small>
                        </div>
                    </div>
                </td>
                <td>${report.survey?.address || 'N/A'}</td>
                <td>${report.survey?.customerType || 'N/A'}</td>
                <td>${new Date(report.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="adminReportManager.viewReport('${report._id}')" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="window.open('/reports/view/${report.shareId}', '_blank')" title="Xem báo cáo">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="adminReportManager.deleteReport('${report._id}', '${report.survey?.name || report.shareId}')" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Render pagination
    renderPagination() {
        const pagination = document.getElementById('reportsPagination');
        
        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <nav>
                <ul class="pagination justify-content-center">
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="adminReportManager.loadReports(${this.currentPage - 1}, '${this.currentSearch}', '${this.currentUserId}')">
                            <i class="fas fa-chevron-left"></i>
                        </a>
                    </li>
        `;

        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="adminReportManager.loadReports(${i}, '${this.currentSearch}', '${this.currentUserId}')">${i}</a>
                </li>
            `;
        }

        paginationHTML += `
                    <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="adminReportManager.loadReports(${this.currentPage + 1}, '${this.currentSearch}', '${this.currentUserId}')">
                            <i class="fas fa-chevron-right"></i>
                        </a>
                    </li>
                </ul>
            </nav>
        `;

        pagination.innerHTML = paginationHTML;
    }

    // Search and filter
    searchReports() {
        const searchInput = document.getElementById('reportSearch');
        const userFilter = document.getElementById('userFilter');
        
        this.currentSearch = searchInput.value.trim();
        this.currentUserId = userFilter.value;
        
        this.loadReports(1, this.currentSearch, this.currentUserId);
    }

    // View report details
    async viewReport(reportId) {
        try {
            const response = await fetch(`${this.baseURL}/admin/reports/${reportId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const report = await response.json();
                if (report) {
                    this.showReportDetailsModal(report);
                } else {
                    throw new Error('Không tìm thấy báo cáo');
                }
            } else {
                throw new Error('Không thể tải chi tiết báo cáo');
            }
        } catch (error) {
            console.error('Lỗi khi tải chi tiết báo cáo:', error);
            this.showError('Lỗi khi tải chi tiết báo cáo');
        }
    }

    // Show report details modal
    showReportDetailsModal(report) {
        const modalHTML = `
            <div class="modal fade" id="reportDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Chi tiết báo cáo</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="text-primary">Thông tin khách hàng</h6>
                                    <table class="table table-borderless table-sm">
                                        <tr>
                                            <td><strong>Tên:</strong></td>
                                            <td>${report.survey?.name || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Địa chỉ:</strong></td>
                                            <td>${report.survey?.address || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Loại khách hàng:</strong></td>
                                            <td>${report.survey?.customerType || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Khu vực:</strong></td>
                                            <td>${report.survey?.region || 'N/A'}</td>
                                        </tr>
                                    </table>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="text-primary">Thông tin báo cáo</h6>
                                    <table class="table table-borderless table-sm">
                                        <tr>
                                            <td><strong>ID chia sẻ:</strong></td>
                                            <td><code>${report.shareId}</code></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Người tạo:</strong></td>
                                            <td>${report.user?.name || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Ngày tạo:</strong></td>
                                            <td>${new Date(report.createdAt).toLocaleString('vi-VN')}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Cập nhật:</strong></td>
                                            <td>${new Date(report.updatedAt).toLocaleString('vi-VN')}</td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                            
                            ${report.scenarios && report.scenarios.length > 0 ? `
                                <hr>
                                <h6 class="text-primary">Kịch bản phân tích</h6>
                                <div class="row">
                                    ${report.scenarios.map((scenario, index) => `
                                        <div class="col-md-6 mb-3">
                                            <div class="card">
                                                <div class="card-header">
                                                    <h6 class="mb-0">${scenario.scenarioName || `Kịch bản ${index + 1}`}</h6>
                                                </div>
                                                <div class="card-body">
                                                    <div class="row">
                                                        <div class="col-6">
                                                            <small class="text-muted">Công suất khuyến nghị:</small>
                                                            <div class="fw-bold">${scenario.results?.recommendedKwp || 0} kWp</div>
                                                        </div>
                                                        <div class="col-6">
                                                            <small class="text-muted">Tổng đầu tư:</small>
                                                            <div class="fw-bold text-success">${(scenario.results?.totalInvestment || 0).toLocaleString('vi-VN')} VNĐ</div>
                                                        </div>
                                                        <div class="col-6">
                                                            <small class="text-muted">Tiết kiệm/tháng:</small>
                                                            <div class="fw-bold text-primary">${(scenario.results?.monthlySavings || 0).toLocaleString('vi-VN')} VNĐ</div>
                                                        </div>
                                                        <div class="col-6">
                                                            <small class="text-muted">Thời gian hoàn vốn:</small>
                                                            <div class="fw-bold">${scenario.results?.paybackPeriodYears || 0} năm</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p class="text-muted">Chưa có kịch bản phân tích</p>'}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                            <button type="button" class="btn btn-primary" onclick="window.open('/reports/view/${report.shareId}', '_blank')">
                                <i class="fas fa-external-link-alt me-2"></i>Xem báo cáo đầy đủ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('reportDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('reportDetailsModal'));
        modal.show();
    }

    // Delete report
    async deleteReport(reportId, reportName) {
        if (!confirm(`Bạn có chắc chắn muốn xóa báo cáo "${reportName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/admin/reports/${reportId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showSuccess('Xóa báo cáo thành công');
                this.loadReports(this.currentPage, this.currentSearch, this.currentUserId);
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete report');
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            this.showError(error.message || 'Lỗi khi xóa báo cáo');
        }
    }

    // Load users for filter dropdown
    async loadUsersForFilter() {
        try {
            const response = await fetch(`${this.baseURL}/admin/users?limit=100`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const userFilter = document.getElementById('userFilter');
                
                userFilter.innerHTML = '<option value="">Tất cả người dùng</option>' +
                    data.users.map(user => `<option value="${user._id}">${user.name} (${user.email})</option>`).join('');
            }
        } catch (error) {
            console.error('Error loading users for filter:', error);
        }
    }

    // Utility functions
    showLoading(show) {
        const loading = document.getElementById('reportsLoading');
        const table = document.getElementById('reportsTable');
        
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
        
        const container = document.getElementById('reports');
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
        
        const container = document.getElementById('reports');
        container.insertAdjacentHTML('afterbegin', alertHTML);
        
        setTimeout(() => {
            const alert = container.querySelector('.alert-success');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 3000);
    }
}

// Initialize report manager
let adminReportManager;

// Function to load reports section
function loadReportsSection() {
    if (!adminReportManager) {
        adminReportManager = new AdminReportManager();
    }
    
    // Update reports section HTML
    const reportsSection = document.getElementById('reports');
    reportsSection.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-dark">Quản lý Báo cáo</h2>
            <div class="d-flex gap-2">
                <button class="btn btn-outline-primary" onclick="adminReportManager.loadReports()">
                    <i class="fas fa-sync-alt me-2"></i>Làm mới
                </button>
            </div>
        </div>

        <!-- Search and Filter -->
        <div class="row mb-4">
            <div class="col-md-5">
                <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                    <input type="text" class="form-control" id="reportSearch" placeholder="Tìm kiếm theo tên khách hàng, địa chỉ, ID..." onkeyup="if(event.key==='Enter') adminReportManager.searchReports()">
                </div>
            </div>
            <div class="col-md-4">
                <select class="form-select" id="userFilter" onchange="adminReportManager.searchReports()">
                    <option value="">Tất cả người dùng</option>
                </select>
            </div>
            <div class="col-md-3">
                <button class="btn btn-outline-primary w-100" onclick="adminReportManager.searchReports()">
                    <i class="fas fa-search me-2"></i>Tìm kiếm
                </button>
            </div>
        </div>

        <!-- Loading -->
        <div class="loading text-center" id="reportsLoading" style="display: none;">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Đang tải danh sách báo cáo...</p>
        </div>

        <!-- Reports Table -->
        <div class="table-container">
            <div class="table-responsive" id="reportsTable">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Báo cáo</th>
                            <th>Người tạo</th>
                            <th>Địa chỉ</th>
                            <th>Loại KH</th>
                            <th>Ngày tạo</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody id="reportsTableBody">
                        <tr>
                            <td colspan="6" class="text-center text-muted">Đang tải...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination -->
            <div id="reportsPagination" class="mt-3"></div>
        </div>

        <style>
            .report-icon {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                background: linear-gradient(135deg, #059669, #10b981);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 18px;
            }
        </style>
    `;
    
    // Load data
    adminReportManager.loadUsersForFilter();
    adminReportManager.loadReports();
}

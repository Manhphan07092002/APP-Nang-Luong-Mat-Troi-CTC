// Admin Access Statistics JavaScript
class AdminAccessManager {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('token');
        this.charts = {};
    }

    // Load access statistics
    async loadAccessStats() {
        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.baseURL}/admin/access-stats`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const stats = await response.json();
                this.updateAccessCards(stats);
                this.createAccessCharts(stats);
            } else {
                throw new Error('Failed to load access stats');
            }
        } catch (error) {
            console.error('Error loading access stats:', error);
            this.showError('Lỗi khi tải thống kê truy cập');
        } finally {
            this.showLoading(false);
        }
    }

    // Update access statistics cards
    updateAccessCards(stats) {
        document.getElementById('totalVisitsCard').textContent = stats.totalVisits || 0;
        document.getElementById('totalLoginsCard').textContent = stats.totalLogins || 0;
        document.getElementById('analysesCreatedCard').textContent = stats.analysesCreated || 0;
        
        // Calculate conversion rate
        const conversionRate = stats.totalVisits > 0 ? 
            ((stats.totalLogins / stats.totalVisits) * 100).toFixed(1) : 0;
        document.getElementById('conversionRateCard').textContent = `${conversionRate}%`;
    }

    // Create access charts
    createAccessCharts(stats) {
        this.createDailyVisitsChart(stats.dailyStats);
        this.createAccessOverviewChart(stats);
    }

    // Create daily visits chart
    createDailyVisitsChart(dailyStats) {
        const ctx = document.getElementById('dailyVisitsChart').getContext('2d');
        
        if (this.charts.dailyVisits) {
            this.charts.dailyVisits.destroy();
        }

        const labels = dailyStats.map(stat => {
            const date = new Date(stat.date);
            return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
        });
        
        const data = dailyStats.map(stat => stat.visits);

        this.charts.dailyVisits = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Lượt truy cập',
                    data: data,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2563eb',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#2563eb',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 10
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
    }

    // Create access overview chart
    createAccessOverviewChart(stats) {
        const ctx = document.getElementById('accessOverviewChart').getContext('2d');
        
        if (this.charts.accessOverview) {
            this.charts.accessOverview.destroy();
        }

        const data = [
            stats.totalVisits - stats.totalLogins, // Visitors without login
            stats.totalLogins, // Logged in users
            stats.analysesCreated // Users who created analyses
        ];

        const labels = ['Khách truy cập', 'Đăng nhập', 'Tạo phân tích'];
        const colors = ['#64748b', '#2563eb', '#059669'];

        this.charts.accessOverview = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Reset statistics
    async resetStats() {
        if (!confirm('Bạn có chắc chắn muốn reset tất cả thống kê? Hành động này không thể hoàn tác.')) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/admin/reset-stats`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showSuccess('Reset thống kê thành công');
                this.loadAccessStats();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to reset stats');
            }
        } catch (error) {
            console.error('Error resetting stats:', error);
            this.showError(error.message || 'Lỗi khi reset thống kê');
        }
    }

    // Utility functions
    showLoading(show) {
        const loading = document.getElementById('accessLoading');
        const content = document.getElementById('accessContent');
        
        if (show) {
            loading.style.display = 'block';
            content.style.opacity = '0.5';
        } else {
            loading.style.display = 'none';
            content.style.opacity = '1';
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
        
        const container = document.getElementById('access');
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
        
        const container = document.getElementById('access');
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

// Initialize access manager
let adminAccessManager;

// Function to load access section
function loadAccessSection() {
    if (!adminAccessManager) {
        adminAccessManager = new AdminAccessManager();
    }
    
    // Update access section HTML
    const accessSection = document.getElementById('access');
    accessSection.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-dark">Thống kê Truy cập</h2>
            <div class="d-flex gap-2">
                <button class="btn btn-outline-primary" onclick="adminAccessManager.loadAccessStats()">
                    <i class="fas fa-sync-alt me-2"></i>Làm mới
                </button>
                <button class="btn btn-outline-danger" onclick="adminAccessManager.resetStats()">
                    <i class="fas fa-trash me-2"></i>Reset thống kê
                </button>
            </div>
        </div>

        <!-- Loading -->
        <div class="loading text-center" id="accessLoading" style="display: none;">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Đang tải thống kê truy cập...</p>
        </div>

        <div id="accessContent">
            <!-- Access Stats Cards -->
            <div class="row mb-4">
                <div class="col-md-3 mb-3">
                    <div class="stat-card">
                        <div class="d-flex align-items-center">
                            <div class="stat-icon" style="background: var(--primary-color);">
                                <i class="fas fa-eye"></i>
                            </div>
                            <div class="ms-3">
                                <h3 class="mb-0" id="totalVisitsCard">0</h3>
                                <p class="text-muted mb-0">Tổng lượt truy cập</p>
                                <small class="text-info">Tất cả thời gian</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="stat-card">
                        <div class="d-flex align-items-center">
                            <div class="stat-icon" style="background: var(--success-color);">
                                <i class="fas fa-sign-in-alt"></i>
                            </div>
                            <div class="ms-3">
                                <h3 class="mb-0" id="totalLoginsCard">0</h3>
                                <p class="text-muted mb-0">Lượt đăng nhập</p>
                                <small class="text-success">Người dùng thực</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="stat-card">
                        <div class="d-flex align-items-center">
                            <div class="stat-icon" style="background: var(--warning-color);">
                                <i class="fas fa-chart-bar"></i>
                            </div>
                            <div class="ms-3">
                                <h3 class="mb-0" id="analysesCreatedCard">0</h3>
                                <p class="text-muted mb-0">Phân tích tạo</p>
                                <small class="text-warning">Báo cáo hoàn thành</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="stat-card">
                        <div class="d-flex align-items-center">
                            <div class="stat-icon" style="background: var(--danger-color);">
                                <i class="fas fa-percentage"></i>
                            </div>
                            <div class="ms-3">
                                <h3 class="mb-0" id="conversionRateCard">0%</h3>
                                <p class="text-muted mb-0">Tỷ lệ chuyển đổi</p>
                                <small class="text-danger">Truy cập → Đăng nhập</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="row">
                <div class="col-md-8">
                    <div class="chart-container">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="mb-0">Lượt truy cập 7 ngày gần nhất</h5>
                            <div class="d-flex align-items-center">
                                <span class="badge bg-primary me-2">
                                    <i class="fas fa-circle me-1" style="font-size: 8px;"></i>
                                    Lượt truy cập
                                </span>
                            </div>
                        </div>
                        <canvas id="dailyVisitsChart" height="300"></canvas>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="chart-container">
                        <h5 class="mb-3">Phân tích hành vi người dùng</h5>
                        <canvas id="accessOverviewChart" height="300"></canvas>
                    </div>
                </div>
            </div>

            <!-- Additional Stats -->
            <div class="row mt-4">
                <div class="col-md-12">
                    <div class="table-container">
                        <h5 class="mb-3">Thông tin chi tiết</h5>
                        <div class="row">
                            <div class="col-md-4">
                                <div class="card border-0 bg-light">
                                    <div class="card-body text-center">
                                        <i class="fas fa-users fa-2x text-primary mb-2"></i>
                                        <h6>Người dùng hoạt động</h6>
                                        <p class="text-muted mb-0">Những người dùng đã đăng nhập và sử dụng hệ thống</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card border-0 bg-light">
                                    <div class="card-body text-center">
                                        <i class="fas fa-chart-line fa-2x text-success mb-2"></i>
                                        <h6>Xu hướng tăng trưởng</h6>
                                        <p class="text-muted mb-0">Theo dõi sự tăng trưởng của lượt truy cập theo thời gian</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card border-0 bg-light">
                                    <div class="card-body text-center">
                                        <i class="fas fa-bullseye fa-2x text-warning mb-2"></i>
                                        <h6>Tối ưu hóa</h6>
                                        <p class="text-muted mb-0">Cải thiện tỷ lệ chuyển đổi từ khách truy cập thành người dùng</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Load access statistics
    adminAccessManager.loadAccessStats();
}

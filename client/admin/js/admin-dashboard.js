// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('token');
        this.charts = {};
        this.init();
    }

    init() {
        this.checkAuth();
        this.loadUserInfo();
        this.loadDashboardData();
    }

    // Authentication
    checkAuth() {
        if (!this.token) {
            window.location.href = '/admin/login.html';
            return;
        }
        
        // Check if user is admin
        this.verifyAdminRole();
    }
    
    async verifyAdminRole() {
        try {
            const response = await fetch(`${this.baseURL}/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                if (user.role !== 'admin') {
                    alert('Bạn không có quyền truy cập trang này!');
                    window.location.href = '/admin/login.html';
                    return;
                }
            } else {
                // Token invalid
                localStorage.removeItem('token');
                window.location.href = '/admin/login.html';
            }
        } catch (error) {
            console.error('Error verifying admin role:', error);
            window.location.href = '/admin/login.html';
        }
    }

    async loadUserInfo() {
        try {
            const response = await fetch(`${this.baseURL}/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const user = await response.json();
                document.getElementById('userName').textContent = user.name;
                document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    // Dashboard Data Loading
    async loadDashboardData() {
        this.showLoading(true);
        try {
            await Promise.all([
                this.loadStats(),
                this.loadDetailedStats()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Lỗi khi tải dữ liệu dashboard');
        } finally {
            this.showLoading(false);
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.baseURL}/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const stats = await response.json();
                this.updateStatsCards(stats);
            } else {
                throw new Error('Failed to load stats');
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            throw error;
        }
    }

    async loadDetailedStats() {
        try {
            const response = await fetch(`${this.baseURL}/admin/stats/detailed`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const detailedStats = await response.json();
                this.updateCharts(detailedStats);
                this.updateTopUsersTable(detailedStats.topUsers);
            } else {
                throw new Error('Failed to load detailed stats');
            }
        } catch (error) {
            console.error('Error loading detailed stats:', error);
            throw error;
        }
    }

    // UI Updates
    updateStatsCards(stats) {
        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('totalReports').textContent = stats.totalReports || 0;
        document.getElementById('totalVisits').textContent = stats.totalVisits || 0;
        document.getElementById('analysesCreated').textContent = stats.analysesCreated || 0;
        
        document.getElementById('recentUsers').textContent = `+${stats.recentUsers || 0} trong 30 ngày`;
        document.getElementById('recentReports').textContent = `+${stats.recentReports || 0} trong 30 ngày`;
        document.getElementById('totalLogins').textContent = `${stats.logins || 0} đăng nhập`;
        document.getElementById('totalAdmins').textContent = `${stats.totalAdmins || 0} admin`;
    }

    updateCharts(data) {
        this.createUsersChart(data.usersByMonth);
        this.createReportsChart(data.reportsByMonth);
        this.createRolesChart(data.usersByRole);
    }

    createUsersChart(usersByMonth) {
        const ctx = document.getElementById('usersChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.users) {
            this.charts.users.destroy();
        }

        const labels = this.generateMonthLabels(6);
        const data = this.processMonthlyData(usersByMonth, labels);

        this.charts.users = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Người dùng mới',
                    data: data,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createReportsChart(reportsByMonth) {
        const ctx = document.getElementById('reportsChart').getContext('2d');
        
        if (this.charts.reports) {
            this.charts.reports.destroy();
        }

        const labels = this.generateMonthLabels(6);
        const data = this.processMonthlyData(reportsByMonth, labels);

        this.charts.reports = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Báo cáo mới',
                    data: data,
                    backgroundColor: '#059669',
                    borderColor: '#047857',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createRolesChart(usersByRole) {
        const ctx = document.getElementById('rolesChart').getContext('2d');
        
        if (this.charts.roles) {
            this.charts.roles.destroy();
        }

        const labels = usersByRole.map(item => item._id === 'admin' ? 'Admin' : 'User');
        const data = usersByRole.map(item => item.count);
        const colors = ['#2563eb', '#059669'];

        this.charts.roles = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
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
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    updateTopUsersTable(topUsers) {
        const tbody = document.getElementById('topUsersTable');
        
        if (!topUsers || topUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Không có dữ liệu</td></tr>';
            return;
        }

        tbody.innerHTML = topUsers.map(user => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="user-avatar me-2" style="width: 30px; height: 30px; font-size: 12px;">
                            ${user.userName ? user.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        ${user.userName || 'Unknown'}
                    </div>
                </td>
                <td class="text-muted">${user.userEmail || 'N/A'}</td>
                <td>
                    <span class="badge bg-primary">${user.reportCount}</span>
                </td>
            </tr>
        `).join('');
    }

    // Utility Functions
    generateMonthLabels(count) {
        const labels = [];
        const now = new Date();
        
        for (let i = count - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }));
        }
        
        return labels;
    }

    processMonthlyData(mongoData, labels) {
        const data = new Array(labels.length).fill(0);
        const now = new Date();
        
        mongoData.forEach(item => {
            const monthIndex = (now.getMonth() - (now.getMonth() - (item._id.month - 1))) + (labels.length - 6);
            if (monthIndex >= 0 && monthIndex < data.length) {
                data[monthIndex] = item.count;
            }
        });
        
        return data;
    }

    showLoading(show) {
        const loading = document.getElementById('dashboardLoading');
        const statsCards = document.getElementById('statsCards');
        
        if (show) {
            loading.style.display = 'block';
            statsCards.style.opacity = '0.5';
        } else {
            loading.style.display = 'none';
            statsCards.style.opacity = '1';
        }
    }

    showError(message) {
        const alertHtml = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        const container = document.querySelector('.main-content');
        container.insertAdjacentHTML('afterbegin', alertHtml);
    }

    // Public Methods
    async refreshStats() {
        await this.loadDashboardData();
        this.showSuccess('Dữ liệu đã được làm mới');
    }

    showSuccess(message) {
        const alertHtml = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        const container = document.querySelector('.main-content');
        container.insertAdjacentHTML('afterbegin', alertHtml);
        
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

// Navigation Functions
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).style.display = 'block';
    
    // Add active class to clicked nav link
    event.target.classList.add('active');
    
    // Load section-specific data
    switch(sectionId) {
        case 'dashboard':
            if (window.adminDashboard) {
                window.adminDashboard.loadDashboardData();
            }
            break;
        case 'users':
            loadUsersSection();
            break;
        case 'reports':
            loadReportsSection();
            break;
        case 'access':
            loadAccessSection();
            break;
        case 'analytics':
            loadAnalyticsSection();
            break;
    }
}

// Placeholder functions for other sections
function loadUsersSection() {
    console.log('Loading users section...');
    // Will be implemented in separate files
}

function loadReportsSection() {
    console.log('Loading reports section...');
    // Will be implemented in separate files
}

function loadAccessSection() {
    console.log('Loading access section...');
    // Will be implemented in separate files
}

function loadAnalyticsSection() {
    console.log('Loading analytics section...');
    // Will be implemented in separate files
}

// Global Functions
function refreshStats() {
    if (window.adminDashboard) {
        window.adminDashboard.refreshStats();
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../login.html';
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    window.adminDashboard = new AdminDashboard();
});

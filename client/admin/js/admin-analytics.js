// Admin Analytics JavaScript
class AdminAnalyticsManager {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('token');
        this.charts = {};
    }

    // Load detailed analytics
    async loadAnalytics() {
        try {
            this.showLoading(true);
            
            const [statsResponse, detailedResponse] = await Promise.all([
                fetch(`${this.baseURL}/admin/stats`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(`${this.baseURL}/admin/stats/detailed`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            if (statsResponse.ok && detailedResponse.ok) {
                const stats = await statsResponse.json();
                const detailed = await detailedResponse.json();
                
                this.createAdvancedCharts(stats, detailed);
                this.updateAnalyticsCards(stats);
            } else {
                throw new Error('Failed to load analytics data');
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('Lỗi khi tải dữ liệu phân tích');
        } finally {
            this.showLoading(false);
        }
    }

    // Update analytics cards
    updateAnalyticsCards(stats) {
        document.getElementById('growthRate').textContent = 
            `+${((stats.recentUsers / Math.max(stats.totalUsers - stats.recentUsers, 1)) * 100).toFixed(1)}%`;
        document.getElementById('activeUsers').textContent = stats.totalUsers - stats.totalAdmins;
        document.getElementById('reportGrowth').textContent = 
            `+${((stats.recentReports / Math.max(stats.totalReports - stats.recentReports, 1)) * 100).toFixed(1)}%`;
        document.getElementById('avgReportsPerUser').textContent = 
            (stats.totalReports / Math.max(stats.totalUsers, 1)).toFixed(1);
    }

    // Create advanced charts
    createAdvancedCharts(stats, detailed) {
        this.createGrowthTrendChart(detailed.usersByMonth, detailed.reportsByMonth);
        this.createUserActivityChart(detailed.topUsers);
        this.createPerformanceMetricsChart(stats);
        this.createHeatmapChart();
    }

    // Growth trend chart
    createGrowthTrendChart(usersByMonth, reportsByMonth) {
        const ctx = document.getElementById('growthTrendChart').getContext('2d');
        
        if (this.charts.growthTrend) {
            this.charts.growthTrend.destroy();
        }

        const labels = this.generateMonthLabels(6);
        const userData = this.processMonthlyData(usersByMonth, labels);
        const reportData = this.processMonthlyData(reportsByMonth, labels);

        this.charts.growthTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Người dùng mới',
                    data: userData,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Báo cáo mới',
                    data: reportData,
                    borderColor: '#059669',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
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
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
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

    // User activity chart
    createUserActivityChart(topUsers) {
        const ctx = document.getElementById('userActivityChart').getContext('2d');
        
        if (this.charts.userActivity) {
            this.charts.userActivity.destroy();
        }

        const labels = topUsers.slice(0, 8).map(user => user.userName || 'Unknown');
        const data = topUsers.slice(0, 8).map(user => user.reportCount);
        const colors = [
            '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed',
            '#0891b2', '#be123c', '#4338ca'
        ];

        this.charts.userActivity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số báo cáo',
                    data: data,
                    backgroundColor: colors,
                    borderRadius: 6,
                    borderSkipped: false
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
                    x: {
                        ticks: {
                            maxRotation: 45
                        }
                    },
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

    // Performance metrics chart
    createPerformanceMetricsChart(stats) {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        
        if (this.charts.performance) {
            this.charts.performance.destroy();
        }

        const data = {
            labels: ['Hiệu suất hệ thống', 'Tỷ lệ hoàn thành', 'Độ hài lòng', 'Tăng trưởng'],
            datasets: [{
                label: 'Hiện tại',
                data: [85, 92, 88, 76],
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                borderColor: '#2563eb',
                borderWidth: 2
            }, {
                label: 'Mục tiêu',
                data: [90, 95, 90, 80],
                backgroundColor: 'rgba(5, 150, 105, 0.2)',
                borderColor: '#059669',
                borderWidth: 2
            }]
        };

        this.charts.performance = new Chart(ctx, {
            type: 'radar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                }
            }
        });
    }

    // Heatmap chart (simulated)
    createHeatmapChart() {
        const heatmapContainer = document.getElementById('heatmapChart');
        
        // Generate mock heatmap data
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const hours = Array.from({length: 24}, (_, i) => i);
        
        let heatmapHTML = '<div class="heatmap-container">';
        heatmapHTML += '<div class="heatmap-labels">';
        days.forEach(day => {
            heatmapHTML += `<div class="day-label">${day}</div>`;
        });
        heatmapHTML += '</div>';
        
        heatmapHTML += '<div class="heatmap-grid">';
        days.forEach((day, dayIndex) => {
            heatmapHTML += '<div class="heatmap-row">';
            hours.forEach(hour => {
                const intensity = Math.random() * 100;
                const color = this.getHeatmapColor(intensity);
                heatmapHTML += `<div class="heatmap-cell" style="background-color: ${color}" title="${day} ${hour}:00 - ${intensity.toFixed(0)}% hoạt động"></div>`;
            });
            heatmapHTML += '</div>';
        });
        heatmapHTML += '</div></div>';
        
        heatmapContainer.innerHTML = heatmapHTML;
    }

    // Get heatmap color based on intensity
    getHeatmapColor(intensity) {
        const colors = [
            '#f3f4f6', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa',
            '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'
        ];
        const index = Math.floor((intensity / 100) * (colors.length - 1));
        return colors[index];
    }

    // Utility functions
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
        const loading = document.getElementById('analyticsLoading');
        const content = document.getElementById('analyticsContent');
        
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
        
        const container = document.getElementById('analytics');
        container.insertAdjacentHTML('afterbegin', alertHTML);
    }
}

// Initialize analytics manager
let adminAnalyticsManager;

// Function to load analytics section
function loadAnalyticsSection() {
    if (!adminAnalyticsManager) {
        adminAnalyticsManager = new AdminAnalyticsManager();
    }
    
    // Update analytics section HTML
    const analyticsSection = document.getElementById('analytics');
    analyticsSection.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-dark">Phân tích Chi tiết</h2>
            <button class="btn btn-primary" onclick="adminAnalyticsManager.loadAnalytics()">
                <i class="fas fa-sync-alt me-2"></i>Làm mới
            </button>
        </div>

        <!-- Loading -->
        <div class="loading text-center" id="analyticsLoading" style="display: none;">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Đang tải dữ liệu phân tích...</p>
        </div>

        <div id="analyticsContent">
            <!-- Advanced Stats Cards -->
            <div class="row mb-4">
                <div class="col-md-3 mb-3">
                    <div class="stat-card">
                        <div class="d-flex align-items-center">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #059669, #10b981);">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="ms-3">
                                <h3 class="mb-0" id="growthRate">+0%</h3>
                                <p class="text-muted mb-0">Tăng trưởng User</p>
                                <small class="text-success">30 ngày qua</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="stat-card">
                        <div class="d-flex align-items-center">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #2563eb, #3b82f6);">
                                <i class="fas fa-users-cog"></i>
                            </div>
                            <div class="ms-3">
                                <h3 class="mb-0" id="activeUsers">0</h3>
                                <p class="text-muted mb-0">User Hoạt động</p>
                                <small class="text-primary">Không bao gồm admin</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="stat-card">
                        <div class="d-flex align-items-center">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #d97706, #f59e0b);">
                                <i class="fas fa-file-chart-line"></i>
                            </div>
                            <div class="ms-3">
                                <h3 class="mb-0" id="reportGrowth">+0%</h3>
                                <p class="text-muted mb-0">Tăng trưởng BC</p>
                                <small class="text-warning">Báo cáo mới</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="stat-card">
                        <div class="d-flex align-items-center">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #dc2626, #ef4444);">
                                <i class="fas fa-calculator"></i>
                            </div>
                            <div class="ms-3">
                                <h3 class="mb-0" id="avgReportsPerUser">0</h3>
                                <p class="text-muted mb-0">TB BC/User</p>
                                <small class="text-danger">Trung bình</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Advanced Charts -->
            <div class="row mb-4">
                <div class="col-md-8">
                    <div class="chart-container">
                        <h5 class="mb-3">Xu hướng tăng trưởng</h5>
                        <canvas id="growthTrendChart" height="300"></canvas>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="chart-container">
                        <h5 class="mb-3">Hiệu suất hệ thống</h5>
                        <canvas id="performanceChart" height="300"></canvas>
                    </div>
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="chart-container">
                        <h5 class="mb-3">Top User hoạt động</h5>
                        <canvas id="userActivityChart" height="300"></canvas>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="chart-container">
                        <h5 class="mb-3">Bản đồ nhiệt hoạt động (Giờ/Ngày)</h5>
                        <div id="heatmapChart" style="height: 300px; overflow: auto;"></div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .heatmap-container {
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            .heatmap-labels {
                display: flex;
                margin-bottom: 5px;
            }
            .day-label {
                width: 30px;
                text-align: center;
                font-size: 12px;
                font-weight: bold;
                color: #64748b;
            }
            .heatmap-grid {
                display: flex;
                flex-direction: column;
                gap: 1px;
            }
            .heatmap-row {
                display: flex;
                gap: 1px;
            }
            .heatmap-cell {
                width: 12px;
                height: 12px;
                border-radius: 2px;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .heatmap-cell:hover {
                transform: scale(1.2);
                z-index: 10;
                position: relative;
            }
        </style>
    `;
    
    // Load analytics data
    adminAnalyticsManager.loadAnalytics();
}
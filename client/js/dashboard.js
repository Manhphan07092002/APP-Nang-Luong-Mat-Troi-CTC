document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');

    const headers = {
        'Authorization': `Bearer ${token}`
    };

    // Hàm để cập nhật giá trị trên UI
    const updateUI = (elementId, value, defaultValue = '0') => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value || defaultValue;
        }
    };

    // Lấy dữ liệu thống kê tổng quan
    const fetchGeneralStats = async () => {
        try {
            const response = await fetch('/api/admin/stats', { headers });
            if (!response.ok) {
                throw new Error(`Lỗi HTTP: ${response.status}`);
            }
            const data = await response.json();

            updateUI('totalUsers', data.totalUsers);
            updateUI('totalReports', data.totalReports);
            updateUI('totalVisits', data.totalVisits);
            updateUI('analysesCreated', data.analysesCreated);
            updateUI('adminUsers', data.totalAdmins);
            updateUI('regularUsers', data.totalUsers - data.totalAdmins);
            
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu thống kê tổng quan:', error);
        }
    };

    // Lấy dữ liệu thống kê chi tiết cho biểu đồ
    const fetchDetailedStats = async () => {
        try {
            const response = await fetch('/api/admin/stats/detailed', { headers });
            if (!response.ok) {
                throw new Error(`Lỗi HTTP: ${response.status}`);
            }
            const data = await response.json();
            
            renderUserDistributionChart(data.usersByRole);
            renderActivityChart(data.usersByMonth, data.reportsByMonth);

        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu thống kê chi tiết:', error);
        }
    };

    // Vẽ biểu đồ phân bố người dùng
    const renderUserDistributionChart = (usersByRole) => {
        const ctx = document.getElementById('dashboardUserDistChart')?.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (window.userDistChart) {
            window.userDistChart.destroy();
        }

        const adminData = usersByRole.find(role => role._id === 'admin');
        const userData = usersByRole.find(role => role._id === 'user');

        window.userDistChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Admin', 'User'],
                datasets: [{
                    label: 'Phân bố Users',
                    data: [adminData?.count || 0, userData?.count || 0],
                    backgroundColor: ['#4facfe', '#43e97b'],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    };
    
    // Vẽ biểu đồ hoạt động hệ thống
    const renderActivityChart = (usersByMonth, reportsByMonth) => {
        const ctx = document.getElementById('dashboardActivityChart')?.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (window.activityChart) {
            window.activityChart.destroy();
        }

        const labels = [];
        const usersData = [];
        const reportsData = [];

        // Tạo nhãn cho 6 tháng gần nhất
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            labels.push(`${d.getMonth() + 1}/${d.getFullYear()}`);
        }

        // Điền dữ liệu vào các tháng tương ứng
        labels.forEach((label, index) => {
            const [month, year] = label.split('/');
            const userMonthData = usersByMonth.find(d => d._id.year == year && d._id.month == month);
            const reportMonthData = reportsByMonth.find(d => d._id.year == year && d._id.month == month);
            usersData[index] = userMonthData ? userMonthData.count : 0;
            reportsData[index] = reportMonthData ? reportMonthData.count : 0;
        });

        window.activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Users Mới',
                        data: usersData,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Reports Mới',
                        data: reportsData,
                        borderColor: '#f5576c',
                        backgroundColor: 'rgba(245, 87, 108, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    };

    // Gọi các hàm để tải dữ liệu
    fetchGeneralStats();
    fetchDetailedStats();
});

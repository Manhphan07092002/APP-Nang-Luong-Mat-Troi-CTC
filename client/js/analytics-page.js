document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        console.error('Không tìm thấy token xác thực.');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`
    };

    // Fetch detailed stats for growth and top users charts
    const fetchDetailedStats = async () => {
        try {
            const response = await fetch('/api/admin/stats/detailed', { headers });
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data = await response.json();
            renderGrowthChart(data.usersByMonth, data.reportsByMonth);
            renderTopUsersChart(data.topUsers);
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu thống kê chi tiết:', error);
        }
    };

    // Fetch access stats for the access chart
    const fetchAccessStats = async () => {
        try {
            const response = await fetch('/api/admin/access-stats', { headers });
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data = await response.json();
            renderAccessStatsChart(data.dailyStats);
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu thống kê truy cập:', error);
        }
    };

    // Render Growth Chart
    const renderGrowthChart = (usersByMonth, reportsByMonth) => {
        const ctx = document.getElementById('growthChart')?.getContext('2d');
        if (!ctx) return;

        const labels = [];
        const usersData = [];
        const reportsData = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            labels.push(`${d.getMonth() + 1}/${d.getFullYear()}`);
        }

        labels.forEach((label, index) => {
            const [month, year] = label.split('/');
            const userMonthData = usersByMonth.find(d => d._id.year == year && d._id.month == month);
            const reportMonthData = reportsByMonth.find(d => d._id.year == year && d._id.month == month);
            usersData[index] = userMonthData ? userMonthData.count : 0;
            reportsData[index] = reportMonthData ? reportMonthData.count : 0;
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Users Mới', data: usersData, borderColor: '#667eea', tension: 0.3, fill: false },
                    { label: 'Reports Mới', data: reportsData, borderColor: '#f5576c', tension: 0.3, fill: false }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    };

    // Render Top Users Chart
    const renderTopUsersChart = (topUsers) => {
        const ctx = document.getElementById('topUsersChart')?.getContext('2d');
        if (!ctx) return;

        const labels = topUsers.map(u => u.userName || u.userEmail || 'N/A');
        const data = topUsers.map(u => u.reportCount);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số lượng Reports',
                    data: data,
                    backgroundColor: '#4facfe',
                    borderColor: '#00f2fe',
                    borderWidth: 1
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                indexAxis: 'y',
                scales: { x: { beginAtZero: true } },
                plugins: { legend: { display: false } }
            }
        });
    };

    // Render Access Stats Chart
    const renderAccessStatsChart = (dailyStats) => {
        const ctx = document.getElementById('accessStatsChart')?.getContext('2d');
        if (!ctx) return;

        const labels = dailyStats.map(s => s.date);
        const data = dailyStats.map(s => s.visits);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Lượt truy cập',
                    data: data,
                    backgroundColor: '#43e97b',
                    borderColor: '#38f9d7',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    };

    // Initial data fetch
    fetchDetailedStats();
    fetchAccessStats();
});

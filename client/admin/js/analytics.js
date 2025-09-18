document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/client/admin/login.html';
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const fetchWithAuth = (url) => fetch(url, { headers });

    const showLoading = (chartId) => {
        const ctx = document.getElementById(chartId).getContext('2d');
        ctx.font = '20px Arial';
        ctx.fillStyle = '#888';
        ctx.textAlign = 'center';
        ctx.fillText('Đang tải dữ liệu...', ctx.canvas.width / 2, ctx.canvas.height / 2);
    };

    const showError = (chartId, message) => {
        const ctx = document.getElementById(chartId).getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '20px Arial';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.fillText(message, ctx.canvas.width / 2, ctx.canvas.height / 2);
    };

    // 1. Growth Chart
    const renderGrowthChart = async () => {
        showLoading('growthChart');
        try {
            const res = await fetchWithAuth('/api/admin/stats/detailed');
            if (!res.ok) throw new Error('Không thể tải dữ liệu tăng trưởng.');
            const data = await res.json();

            const labels = [];
            const userCounts = [];
            const reportCounts = [];

            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const month = d.getMonth() + 1;
                const year = d.getFullYear();
                labels.push(`Tháng ${month}/${year}`);

                const userMonthData = data.usersByMonth.find(item => item._id.year === year && item._id.month === month);
                userCounts.push(userMonthData ? userMonthData.count : 0);

                const reportMonthData = data.reportsByMonth.find(item => item._id.year === year && item._id.month === month);
                reportCounts.push(reportMonthData ? reportMonthData.count : 0);
            }

            new Chart(document.getElementById('growthChart'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Người dùng mới',
                            data: userCounts,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: true,
                        },
                        {
                            label: 'Báo cáo mới',
                            data: reportCounts,
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            fill: true,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        } catch (error) {
            console.error('Error rendering growth chart:', error);
            showError('growthChart', error.message);
        }
    };

    // 2. Top Users Chart
    const renderTopUsersChart = async () => {
        showLoading('topUsersChart');
        try {
            const res = await fetchWithAuth('/api/admin/stats/detailed');
            if (!res.ok) throw new Error('Không thể tải dữ liệu người dùng.');
            const data = await res.json();

            const labels = data.topUsers.map(u => u.userName || u.userEmail || 'N/A');
            const counts = data.topUsers.map(u => u.reportCount);

            new Chart(document.getElementById('topUsersChart'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Số lượng báo cáo',
                        data: counts,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error rendering top users chart:', error);
            showError('topUsersChart', error.message);
        }
    };

    // 3. Access Stats Chart
    const renderAccessStatsChart = async () => {
        showLoading('accessStatsChart');
        try {
            const res = await fetchWithAuth('/api/admin/access-stats');
            if (!res.ok) throw new Error('Không thể tải thống kê truy cập.');
            const data = await res.json();

            const labels = data.dailyStats.map(d => new Date(d.date).toLocaleDateString('vi-VN'));
            const visits = data.dailyStats.map(d => d.visits);

            new Chart(document.getElementById('accessStatsChart'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Lượt truy cập',
                        data: visits,
                        borderColor: 'rgba(153, 102, 255, 1)',
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        } catch (error) {
            console.error('Error rendering access stats chart:', error);
            showError('accessStatsChart', error.message);
        }
    };

    renderGrowthChart();
    renderTopUsersChart();
    renderAccessStatsChart();
});

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    let accessChart = null;

    const fetchData = async () => {
        try {
            const response = await fetch('/api/admin/access-stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể tải dữ liệu thống kê');
            }

            const data = await response.json();
            updateUI(data);

        } catch (error) {
            console.error('Lỗi khi tải thống kê:', error);
            document.querySelector('.main-content').innerHTML = 
                `<div class="alert alert-danger">Lỗi khi tải dữ liệu. Vui lòng thử lại.</div>`;
        }
    };

    const updateUI = (data) => {
        document.getElementById('total-visits').textContent = data.totalVisits.toLocaleString() || '0';
        document.getElementById('total-logins').textContent = data.totalLogins.toLocaleString() || '0';
        document.getElementById('analyses-created').textContent = data.analysesCreated.toLocaleString() || '0';

        const chartCtx = document.getElementById('access-chart').getContext('2d');
        const labels = data.dailyStats.map(stat => new Date(stat.date).toLocaleDateString('vi-VN'));
        const chartData = data.dailyStats.map(stat => stat.visits);

        if (accessChart) {
            accessChart.destroy();
        }

        accessChart = new Chart(chartCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Lượt Truy Cập',
                    data: chartData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 10
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    };

    const resetStats = async () => {
        if (!confirm('Bạn có chắc chắn muốn reset toàn bộ thống kê truy cập không? Hành động này không thể hoàn tác.')) {
            return;
        }

        try {
            const response = await fetch('/api/admin/reset-stats', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể reset thống kê');
            }

            alert('Đã reset thống kê thành công!');
            fetchData(); // Tải lại dữ liệu sau khi reset

        } catch (error) {
            console.error('Lỗi khi reset thống kê:', error);
            alert('Đã xảy ra lỗi khi reset thống kê.');
        }
    };

    document.getElementById('reset-stats-btn').addEventListener('click', resetStats);

    fetchData();
});

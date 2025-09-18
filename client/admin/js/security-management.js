document.addEventListener('DOMContentLoaded', () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
        window.location.href = 'login.html';
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
    };

    const API_BASE = '/api/admin/security';

    const statsContainer = document.getElementById('security-stats-cards');
    const lockedAccountsList = document.getElementById('locked-accounts-list');
    const lockedAccountsCount = document.getElementById('locked-accounts-count');
    const eventsTbody = document.getElementById('security-events-tbody');
    const eventsPagination = document.getElementById('events-pagination');
    const refreshButton = document.getElementById('refresh-data-btn');

    const fetchSecurityStats = async () => {
        try {
            const response = await fetch(`${API_BASE}/stats`, { headers });
            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            displaySecurityStats(data);
        } catch (error) {
            console.error('Error fetching security stats:', error);
            statsContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger">Không thể tải thống kê bảo mật.</div></div>`;
        }
    };

    const fetchLockedAccounts = async () => {
        try {
            const response = await fetch(`${API_BASE}/locked-accounts`, { headers });
            if (!response.ok) throw new Error('Failed to fetch locked accounts');
            const data = await response.json();
            displayLockedAccounts(data);
        } catch (error) {
            console.error('Error fetching locked accounts:', error);
            lockedAccountsList.innerHTML = `<div class="alert alert-danger p-2">Lỗi tải danh sách.</div>`;
        }
    };

    const fetchSecurityEvents = async (page = 1) => {
        eventsTbody.innerHTML = `<tr><td colspan="4" class="text-center"><div class="spinner-border text-primary" role="status"><span class="sr-only">Đang tải...</span></div></td></tr>`;
        try {
            const response = await fetch(`${API_BASE}/events?page=${page}&limit=10`, { headers });
            if (!response.ok) throw new Error('Failed to fetch security events');
            const data = await response.json();
            displaySecurityEvents(data);
            setupPagination(data.totalPages, data.currentPage);
        } catch (error) {
            console.error('Error fetching security events:', error);
            eventsTbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Không thể tải nhật ký sự kiện.</td></tr>`;
        }
    };

    const displaySecurityStats = (stats) => {
        statsContainer.innerHTML = `
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-info shadow h-100 py-2 security-stats-card">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Tổng Sự Kiện</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">${stats.totalEvents.toLocaleString('vi-VN')}</div>
                            </div>
                            <div class="col-auto"><i class="fas fa-clipboard-list fa-2x text-gray-300"></i></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-danger shadow h-100 py-2 security-stats-card">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Cảnh báo (24h)</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">${stats.criticalEventsToday.toLocaleString('vi-VN')}</div>
                            </div>
                            <div class="col-auto"><i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-warning shadow h-100 py-2 security-stats-card">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Tài Khoản Bị Khóa</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">${stats.lockedAccounts.toLocaleString('vi-VN')}</div>
                            </div>
                            <div class="col-auto"><i class="fas fa-user-lock fa-2x text-gray-300"></i></div>
                        </div>
                    </div>
                </div>
            </div>
             <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-secondary shadow h-100 py-2 security-stats-card">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-secondary text-uppercase mb-1">Đăng nhập thất bại (24h)</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">${stats.failedLoginsToday || 0}</div>
                            </div>
                            <div class="col-auto"><i class="fas fa-times-circle fa-2x text-gray-300"></i></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    const displayLockedAccounts = (accounts) => {
        lockedAccountsCount.textContent = accounts.length;
        if (accounts.length === 0) {
            lockedAccountsList.innerHTML = `<p class="text-center text-muted p-3">Không có tài khoản nào bị khóa.</p>`;
            return;
        }

        lockedAccountsList.innerHTML = accounts.map(acc => `
            <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                <div>
                    <strong class="d-block">${acc.name || 'N/A'}</strong>
                    <small class="text-muted">${acc.email}</small>
                </div>
                <button class="btn btn-success btn-sm unlock-btn" data-user-id="${acc._id}" title="Mở khóa">
                    <i class="fas fa-lock-open"></i>
                </button>
            </div>
        `).join('');
    };

    const displaySecurityEvents = (data) => {
        if (data.events.length === 0) {
            eventsTbody.innerHTML = `<tr><td colspan="4" class="text-center">Không có sự kiện nào.</td></tr>`;
            return;
        }

        eventsTbody.innerHTML = data.events.map(event => `
            <tr>
                <td>${new Date(event.createdAt).toLocaleString('vi-VN')}</td>
                <td>${event.description}</td>
                <td>${event.user ? event.user.email : 'Hệ thống'}</td>
                <td><span class="badge badge-${getLevelClass(event.level)}">${event.level.toUpperCase()}</span></td>
            </tr>
        `).join('');
    };

    const getLevelClass = (level) => {
        switch (level) {
            case 'low': return 'info';
            case 'medium': return 'warning';
            case 'high': return 'danger';
            case 'critical': return 'dark';
            default: return 'secondary';
        }
    };

    const setupPagination = (totalPages, currentPage) => {
        eventsPagination.innerHTML = '';
        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = '#';
            a.textContent = i;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                fetchSecurityEvents(i);
            });
            li.appendChild(a);
            eventsPagination.appendChild(li);
        }
    };
    
    const unlockAccount = async (userId) => {
        if (!confirm('Bạn có chắc muốn mở khóa tài khoản này?')) return;

        try {
            const response = await fetch(`${API_BASE}/unlock-account/${userId}`, {
                method: 'POST',
                headers
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Lỗi không xác định');
            
            alert('Mở khóa tài khoản thành công!');
            fetchAllData(); // Refresh all data
        } catch (error) {
            console.error('Error unlocking account:', error);
            alert(`Lỗi: ${error.message}`);
        }
    };

    lockedAccountsList.addEventListener('click', (e) => {
        const unlockButton = e.target.closest('.unlock-btn');
        if (unlockButton) {
            const userId = unlockButton.dataset.userId;
            unlockAccount(userId);
        }
    });

    const fetchAllData = () => {
        fetchSecurityStats();
        fetchLockedAccounts();
        fetchSecurityEvents();
    };

    refreshButton.addEventListener('click', fetchAllData);

    // Initial data load
    fetchAllData();
});

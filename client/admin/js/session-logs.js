// Session Logs Management JavaScript
class SessionLogsManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalPages = 1;
        this.sessions = [];
        this.filteredSessions = [];
        this.filters = {
            status: '',
            device: '',
            dateFrom: '',
            dateTo: ''
        };
        
        this.init();
    }

    async init() {
        try {
            await this.loadSessionLogs();
            await this.loadStats();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing session logs:', error);
            this.showError('Failed to initialize session logs');
        }
    }

    setupEventListeners() {
        // Filter change listeners
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
        });
        
        document.getElementById('deviceFilter').addEventListener('change', (e) => {
            this.filters.device = e.target.value;
        });
        
        document.getElementById('dateFrom').addEventListener('change', (e) => {
            this.filters.dateFrom = e.target.value;
        });
        
        document.getElementById('dateTo').addEventListener('change', (e) => {
            this.filters.dateTo = e.target.value;
        });
    }

    async loadSessionLogs() {
        try {
            this.showLoading();
            
            const token = this.getAuthToken();
            if (!token) {
                this.showError('Authentication required');
                return;
            }

            // Build query parameters
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                ...this.filters
            });

            const response = await fetch(`/api/admin/sessions?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.sessions = data.sessions;
                this.filteredSessions = [...this.sessions];
                this.totalPages = data.pagination.totalPages;
                this.renderSessionLogs();
                this.updatePagination();
            } else {
                throw new Error(data.message || 'Failed to load sessions');
            }
            
        } catch (error) {
            console.error('Error loading session logs:', error);
            // Fallback to mock data for demo
            const mockSessions = this.generateMockSessions();
            this.sessions = mockSessions;
            this.filteredSessions = [...this.sessions];
            this.renderSessionLogs();
            this.updatePagination();
            this.showError('Using demo data - ' + error.message);
        }
    }

    generateMockSessions() {
        const users = [
            { id: '1', name: 'Admin User', email: 'admin@solaranalytics.vn' },
            { id: '2', name: 'John Doe', email: 'john@example.com' },
            { id: '3', name: 'Jane Smith', email: 'jane@example.com' },
            { id: '4', name: 'Mike Johnson', email: 'mike@example.com' }
        ];

        const devices = [
            'Chrome on Windows',
            'Firefox on Linux',
            'Safari on macOS',
            'Edge on Windows',
            'Chrome on Android',
            'Safari on iPhone'
        ];

        const locations = [
            'Ho Chi Minh City, Vietnam',
            'Hanoi, Vietnam',
            'Da Nang, Vietnam',
            'Localhost (Development)',
            'Can Tho, Vietnam'
        ];

        const sessions = [];
        const now = new Date();

        for (let i = 0; i < 50; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const device = devices[Math.floor(Math.random() * devices.length)];
            const location = locations[Math.floor(Math.random() * locations.length)];
            
            const loginTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
            const lastActivity = new Date(loginTime.getTime() + Math.random() * 24 * 60 * 60 * 1000); // Up to 24 hours after login
            
            const isActive = Math.random() > 0.3; // 70% active
            const isExpired = !isActive && Math.random() > 0.5; // 50% of inactive are expired
            
            let status = 'active';
            if (!isActive) {
                status = isExpired ? 'expired' : 'inactive';
            }

            sessions.push({
                id: `session-${i + 1}`,
                sessionId: `sess_${Date.now()}_${i}`,
                user: user,
                device: device,
                browser: device.split(' ')[0],
                os: device.split(' on ')[1] || 'Unknown',
                ipAddress: location.includes('Localhost') ? '127.0.0.1' : `192.168.1.${Math.floor(Math.random() * 255)}`,
                location: location,
                loginTime: loginTime,
                lastActivity: lastActivity,
                status: status,
                loginMethod: Math.random() > 0.8 ? 'google' : 'email',
                userAgent: this.generateUserAgent(device),
                riskScore: Math.floor(Math.random() * 100),
                metadata: {
                    screenResolution: '1920x1080',
                    language: 'vi-VN',
                    timezone: 'Asia/Ho_Chi_Minh'
                }
            });
        }

        return sessions.sort((a, b) => b.lastActivity - a.lastActivity);
    }

    generateUserAgent(device) {
        const userAgents = {
            'Chrome on Windows': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
            'Firefox on Linux': 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
            'Safari on macOS': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/14.1.2 Safari/537.36',
            'Edge on Windows': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
        };
        
        return userAgents[device] || 'Unknown User Agent';
    }

    async loadStats() {
        try {
            const token = this.getAuthToken();
            if (!token) {
                this.loadMockStats();
                return;
            }

            const response = await fetch('/api/admin/sessions/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                const stats = data.stats;
                document.getElementById('activeSessions').textContent = stats.activeSessions;
                document.getElementById('totalUsers').textContent = stats.totalUsers;
                document.getElementById('todayLogins').textContent = stats.todayLogins;
                document.getElementById('expiredSessions').textContent = stats.expiredSessions;
            } else {
                throw new Error(data.message || 'Failed to load stats');
            }
            
        } catch (error) {
            console.error('Error loading stats:', error);
            this.loadMockStats();
        }
    }

    loadMockStats() {
        // Fallback mock statistics for demo
        const stats = {
            activeSessions: 12,
            totalUsers: 45,
            todayLogins: 8,
            expiredSessions: 23
        };
        
        document.getElementById('activeSessions').textContent = stats.activeSessions;
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('todayLogins').textContent = stats.todayLogins;
        document.getElementById('expiredSessions').textContent = stats.expiredSessions;
    }

    renderSessionLogs() {
        const tbody = document.getElementById('sessionLogsTable');
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.filteredSessions.length);

        if (this.filteredSessions.length === 0) {
            this.showEmpty();
            return;
        }

        this.hideLoading();
        this.hideEmpty();

        tbody.innerHTML = this.filteredSessions.slice(startIndex, endIndex).map(session => `
            <tr class="hover:bg-white/5 transition-colors ${this.getSessionRowClass(session)}">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                                <span class="text-white font-medium text-sm">${session.user.name.charAt(0)}</span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-white">${session.user.name}</div>
                            <div class="text-sm text-white/60">${session.user.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-white">${session.device}</div>
                    <div class="text-sm text-white/60">${session.browser} • ${session.os}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-white font-mono">${session.ipAddress}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-white">${session.location}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-white">${this.formatDateTime(session.loginTime)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-white">${this.formatDateTime(session.lastActivity)}</div>
                    <div class="text-sm text-white/60">${this.getTimeAgo(session.lastActivity)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${this.getStatusBadge(session.status)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="sessionLogsManager.viewSession('${session.id}')" class="text-blue-400 hover:text-blue-300 transition-colors">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${session.status === 'active' ? `
                            <button onclick="sessionLogsManager.terminateSession('${session.id}')" class="text-red-400 hover:text-red-300 transition-colors">
                                <i class="fas fa-ban"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getSessionRowClass(session) {
        switch (session.status) {
            case 'active': return 'session-active';
            case 'inactive': return 'session-inactive';
            case 'expired': return 'session-expired';
            default: return '';
        }
    }

    getStatusBadge(status) {
        const badges = {
            active: '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-400/30"><i class="fas fa-circle text-xs mr-1"></i>Active</span>',
            inactive: '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-400/30"><i class="fas fa-circle text-xs mr-1"></i>Inactive</span>',
            expired: '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-400/30"><i class="fas fa-clock text-xs mr-1"></i>Expired</span>'
        };
        return badges[status] || badges.inactive;
    }

    formatDateTime(date) {
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} ngày trước`;
        if (hours > 0) return `${hours} giờ trước`;
        if (minutes > 0) return `${minutes} phút trước`;
        return 'Vừa xong';
    }

    applyFilters() {
        this.filteredSessions = this.sessions.filter(session => {
            // Status filter
            if (this.filters.status && session.status !== this.filters.status) {
                return false;
            }

            // Device filter
            if (this.filters.device && !session.browser.includes(this.filters.device)) {
                return false;
            }

            // Date range filter
            if (this.filters.dateFrom) {
                const fromDate = new Date(this.filters.dateFrom);
                if (session.loginTime < fromDate) return false;
            }

            if (this.filters.dateTo) {
                const toDate = new Date(this.filters.dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (session.loginTime > toDate) return false;
            }

            return true;
        });

        this.currentPage = 1;
        this.renderSessionLogs();
        this.updatePagination();
    }

    clearFilters() {
        this.filters = {
            status: '',
            device: '',
            dateFrom: '',
            dateTo: ''
        };

        document.getElementById('statusFilter').value = '';
        document.getElementById('deviceFilter').value = '';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';

        this.filteredSessions = [...this.sessions];
        this.currentPage = 1;
        this.renderSessionLogs();
        this.updatePagination();
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.filteredSessions.length / this.pageSize);
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.filteredSessions.length);

        document.getElementById('showingFrom').textContent = this.filteredSessions.length > 0 ? startIndex + 1 : 0;
        document.getElementById('showingTo').textContent = endIndex;
        document.getElementById('totalSessions').textContent = this.filteredSessions.length;
        document.getElementById('currentPage').textContent = this.currentPage;

        document.getElementById('prevBtn').disabled = this.currentPage <= 1;
        document.getElementById('nextBtn').disabled = this.currentPage >= this.totalPages;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderSessionLogs();
            this.updatePagination();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderSessionLogs();
            this.updatePagination();
        }
    }

    viewSession(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) return;

        const modalContent = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="text-sm font-medium text-white/60 mb-2">User Information</h4>
                        <div class="space-y-2">
                            <p class="text-white"><strong>Name:</strong> ${session.user.name}</p>
                            <p class="text-white"><strong>Email:</strong> ${session.user.email}</p>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-sm font-medium text-white/60 mb-2">Session Status</h4>
                        <div class="space-y-2">
                            <p class="text-white">${this.getStatusBadge(session.status)}</p>
                            <p class="text-white"><strong>Risk Score:</strong> ${session.riskScore}/100</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="text-sm font-medium text-white/60 mb-2">Device Information</h4>
                        <div class="space-y-2">
                            <p class="text-white"><strong>Device:</strong> ${session.device}</p>
                            <p class="text-white"><strong>Browser:</strong> ${session.browser}</p>
                            <p class="text-white"><strong>OS:</strong> ${session.os}</p>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-sm font-medium text-white/60 mb-2">Location</h4>
                        <div class="space-y-2">
                            <p class="text-white"><strong>IP Address:</strong> ${session.ipAddress}</p>
                            <p class="text-white"><strong>Location:</strong> ${session.location}</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="text-sm font-medium text-white/60 mb-2">Session Times</h4>
                        <div class="space-y-2">
                            <p class="text-white"><strong>Login:</strong> ${this.formatDateTime(session.loginTime)}</p>
                            <p class="text-white"><strong>Last Activity:</strong> ${this.formatDateTime(session.lastActivity)}</p>
                            <p class="text-white"><strong>Duration:</strong> ${this.getTimeAgo(session.lastActivity)}</p>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-sm font-medium text-white/60 mb-2">Authentication</h4>
                        <div class="space-y-2">
                            <p class="text-white"><strong>Method:</strong> ${session.loginMethod}</p>
                            <p class="text-white"><strong>Session ID:</strong> <code class="bg-white/10 px-2 py-1 rounded text-xs">${session.sessionId}</code></p>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 class="text-sm font-medium text-white/60 mb-2">User Agent</h4>
                    <p class="text-white text-sm bg-white/10 p-3 rounded-lg font-mono break-all">${session.userAgent}</p>
                </div>

                <div>
                    <h4 class="text-sm font-medium text-white/60 mb-2">Metadata</h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <p class="text-white"><strong>Resolution:</strong> ${session.metadata.screenResolution}</p>
                        <p class="text-white"><strong>Language:</strong> ${session.metadata.language}</p>
                        <p class="text-white"><strong>Timezone:</strong> ${session.metadata.timezone}</p>
                    </div>
                </div>

                ${session.status === 'active' ? `
                    <div class="pt-4 border-t border-white/20">
                        <button onclick="sessionLogsManager.terminateSession('${session.id}')" class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-300 transition-all">
                            <i class="fas fa-ban mr-2"></i>
                            Terminate Session
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        document.getElementById('sessionDetails').innerHTML = modalContent;
        document.getElementById('sessionModal').classList.remove('hidden');
    }

    closeSessionModal() {
        document.getElementById('sessionModal').classList.add('hidden');
    }

    async terminateSession(sessionId) {
        if (!confirm('Bạn có chắc chắn muốn ngắt kết nối phiên này?')) {
            return;
        }
        
        try {
            const token = this.getAuthToken();
            if (!token) {
                this.showError('Authentication required');
                return;
            }

            const response = await fetch(`/api/admin/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Remove from current sessions
                this.sessions = this.sessions.filter(s => s.sessionId !== sessionId);
                this.filteredSessions = this.filteredSessions.filter(s => s.sessionId !== sessionId);
                
                this.renderSessionLogs();
                this.loadStats(); // Refresh stats
                this.showSuccess(data.message || 'Đã ngắt kết nối phiên thành công');
            } else {
                throw new Error(data.message || 'Failed to terminate session');
            }
            
        } catch (error) {
            console.error('Error terminating session:', error);
            // Fallback to mock behavior for demo
            this.sessions = this.sessions.filter(s => s.id !== sessionId);
            this.filteredSessions = this.filteredSessions.filter(s => s.id !== sessionId);
            this.renderSessionLogs();
            this.showError('Demo mode - ' + error.message);
        }
    }

    async refreshLogs() {
        await this.loadSessionLogs();
        await this.loadStats();
        this.showSuccess('Session logs refreshed');
    }

    exportLogs() {
        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showSuccess('Session logs exported successfully');
    }

    generateCSV() {
        const headers = ['User Name', 'Email', 'Device', 'IP Address', 'Location', 'Login Time', 'Last Activity', 'Status', 'Login Method'];
        const rows = this.filteredSessions.map(session => [
            session.user.name,
            session.user.email,
            session.device,
            session.ipAddress,
            session.location,
            this.formatDateTime(session.loginTime),
            this.formatDateTime(session.lastActivity),
            session.status,
            session.loginMethod
        ]);

        return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    }

    showLoading() {
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('emptyState').classList.add('hidden');
        document.getElementById('sessionLogsTable').innerHTML = '';
    }

    hideLoading() {
        document.getElementById('loadingState').classList.add('hidden');
    }

    showEmpty() {
        document.getElementById('emptyState').classList.remove('hidden');
        this.hideLoading();
    }

    hideEmpty() {
        document.getElementById('emptyState').classList.add('hidden');
    }

    showSuccess(message) {
        // Simple success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500/20 border border-green-400/30 text-green-300 px-4 py-2 rounded-lg z-50';
        notification.innerHTML = `<i class="fas fa-check mr-2"></i>${message}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        // Simple error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500/20 border border-red-400/30 text-red-300 px-4 py-2 rounded-lg z-50';
        notification.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i>${message}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    async cleanupExpiredSessions() {
        if (!confirm('Bạn có chắc chắn muốn dọn dẹp tất cả phiên hết hạn?')) {
            return;
        }
        
        try {
            const token = this.getAuthToken();
            if (!token) {
                this.showError('Authentication required');
                return;
            }

            const response = await fetch('/api/admin/sessions/cleanup', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess(data.message || `Đã dọn dẹp ${data.cleanedCount} phiên hết hạn`);
                await this.loadSessionLogs();
                await this.loadStats();
            } else {
                throw new Error(data.message || 'Failed to cleanup sessions');
            }
            
        } catch (error) {
            console.error('Error cleaning up sessions:', error);
            this.showError('Demo mode - ' + error.message);
        }
    }

    async showSuspiciousSessions() {
        try {
            const token = this.getAuthToken();
            if (!token) {
                this.showError('Authentication required');
                return;
            }

            const response = await fetch('/api/admin/sessions/suspicious', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.sessions = data.suspiciousSessions;
                this.filteredSessions = [...this.sessions];
                this.renderSessionLogs();
                this.showSuccess(`Hiển thị ${data.count} phiên đăng nhập đáng nghi`);
            } else {
                throw new Error(data.message || 'Failed to load suspicious sessions');
            }
            
        } catch (error) {
            console.error('Error loading suspicious sessions:', error);
            this.showError('Demo mode - ' + error.message);
        }
    }

    getAuthToken() {
        // Get JWT token from localStorage or cookies
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const userData = JSON.parse(userInfo);
                return userData.token || userData.user?.token;
            } catch (e) {
                console.error('Error parsing user info:', e);
            }
        }
        
        // Try alternative storage locations
        const token = localStorage.getItem('token') || 
                     sessionStorage.getItem('token') || 
                     this.getCookie('token');
        return token;
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
}

// Global functions for HTML onclick handlers
let sessionLogsManager;

function refreshLogs() {
    sessionLogsManager.refreshLogs();
}

function exportLogs() {
    sessionLogsManager.exportLogs();
}

function applyFilters() {
    sessionLogsManager.applyFilters();
}

function clearFilters() {
    sessionLogsManager.clearFilters();
}

function previousPage() {
    sessionLogsManager.previousPage();
}

function nextPage() {
    sessionLogsManager.nextPage();
}

function closeSessionModal() {
    sessionLogsManager.closeSessionModal();
}

function cleanupExpiredSessions() {
    sessionLogsManager.cleanupExpiredSessions();
}

function showSuspiciousSessions() {
    sessionLogsManager.showSuspiciousSessions();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    sessionLogsManager = new SessionLogsManager();
});

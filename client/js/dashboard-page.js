// File: client/js/dashboard-page.js

let userInfo = null;
try {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
        userInfo = JSON.parse(userInfoStr);
    }
} catch (error) {
    console.error('Error parsing userInfo:', error);
    localStorage.removeItem('userInfo');
}

if (!userInfo || !userInfo.token) {
    alert('Vui lòng đăng nhập để truy cập trang này.');
    window.location.href = '/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    if (!userInfo) return;

    const tableBody = document.getElementById('reports-table-body');
    const searchInput = document.getElementById('search-input');
    
    if (!tableBody) {
        console.error('Reports table body not found');
        return;
    }
    
    let allReports = [];

    async function loadReports() {
        const loadingRow = document.getElementById('loading-row');
        const emptyState = document.getElementById('empty-state');
        const reportsCount = document.getElementById('reports-count');
        const tableContainer = document.querySelector('.table-modern');
        
        // Show loading state with animation
        if (loadingRow) {
            loadingRow.style.display = 'table-row';
            loadingRow.style.opacity = '0';
            loadingRow.style.transform = 'translateY(20px)';
            setTimeout(() => {
                loadingRow.style.opacity = '1';
                loadingRow.style.transform = 'translateY(0)';
                loadingRow.style.transition = 'all 0.3s ease-out';
            }, 50);
        }
        if (emptyState) emptyState.classList.add('hidden');
        
        // Add loading pulse to table container
        if (tableContainer) {
            tableContainer.classList.add('pulse-animation');
        }
        
        try {
            const response = await fetch('/api/reports', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            
            if (response.status === 401) {
                localStorage.removeItem('userInfo');
                showNotification('⚠️ Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', 'warning', 5000);
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
                return;
            }
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            allReports = await response.json();
            console.log('Loaded reports:', allReports);
            
            // Remove loading pulse
            if (tableContainer) {
                tableContainer.classList.remove('pulse-animation');
            }
            
            // Update reports count with animation
            if (reportsCount) {
                reportsCount.style.transform = 'scale(0.8)';
                reportsCount.style.opacity = '0.5';
                setTimeout(() => {
                    reportsCount.innerHTML = `<i class="fas fa-list mr-1"></i>${allReports.length} báo cáo`;
                    reportsCount.style.transform = 'scale(1)';
                    reportsCount.style.opacity = '1';
                    reportsCount.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
                }, 200);
            }
            
            // Remove success notification for data load - commented out
            // if (allReports.length > 0) {
            //     showNotification(`✅ Đã tải ${allReports.length} báo cáo thành công!`, 'success', 2000);
            // }
            
            displayReports(allReports);
            
        } catch (error) {
            console.error('Error loading reports:', error);
            
            // Remove loading pulse
            if (tableContainer) {
                tableContainer.classList.remove('pulse-animation');
            }
            
            // Hide loading row with animation
            if (loadingRow) {
                loadingRow.style.opacity = '0';
                loadingRow.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    loadingRow.style.display = 'none';
                }, 300);
            }
            
            // Show error message with animation
            const errorRow = document.createElement('tr');
            errorRow.className = 'fade-in';
            errorRow.innerHTML = `
                <td colspan="4" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center justify-center space-y-4">
                        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center bounce-animation">
                            <i class="fas fa-exclamation-triangle text-2xl text-red-400"></i>
                        </div>
                        <p class="text-red-500 font-medium">Lỗi tải dữ liệu: ${error.message}</p>
                        <button onclick="loadReports()" class="btn-modern btn-outline hover:scale-105 transition-all duration-200">
                            <i class="fas fa-sync-alt mr-2"></i>
                            Thử lại
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(errorRow);
            
            // Show error notification
            showNotification('❌ Không thể tải dữ liệu báo cáo', 'error', 5000);
        }
    }

    function displayReports(reports) {
        const tableBody = document.getElementById('reports-table-body');
        const loadingRow = document.getElementById('loading-row');
        const emptyState = document.getElementById('empty-state');
        
        // Hide loading row with animation
        if (loadingRow) {
            loadingRow.style.opacity = '0';
            loadingRow.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                loadingRow.style.display = 'none';
            }, 300);
        }
        
        tableBody.innerHTML = '';
        
        if (reports.length === 0) {
            // Show empty state with animation
            if (emptyState) {
                emptyState.classList.remove('hidden');
                emptyState.style.opacity = '0';
                emptyState.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    emptyState.style.opacity = '1';
                    emptyState.style.transform = 'translateY(0)';
                    emptyState.style.transition = 'all 0.5s ease-out';
                }, 50);
            }
            return;
        }
        
        // Hide empty state
        if (emptyState) emptyState.classList.add('hidden');
    
        // Add staggered animation for table rows
        reports.forEach((report, index) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-all duration-300 table-row-animate';
            row.style.animationDelay = `${index * 0.1}s`;
            
            const creatorName = (userInfo.role === 'admin' && report.user) 
                ? `<div class="text-sm text-gray-500">Tạo bởi: ${report.user.name}</div>` 
                : '';
    
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-medium text-gray-900">${report.survey?.name || 'Không có tên'}</div>
                    ${creatorName}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${report.survey?.address || 'Không có địa chỉ'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(report.createdAt).toLocaleDateString('vi-VN')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div class="flex justify-center space-x-2">
                        <a href="/reports/view/${report.shareId}" target="_blank" class="btn-modern btn-sm btn-primary transform hover:scale-105 transition-all duration-200">
                            <i class="fas fa-eye mr-1"></i>
                            Xem
                        </a>
                        <button onclick="deleteReport('${report._id}')" class="btn-modern btn-sm btn-danger transform hover:scale-105 transition-all duration-200">
                            <i class="fas fa-trash mr-1"></i>
                            Xóa
                        </button>
                    </div>
                </td>
            `;
            
            // Add hover effect for the entire row
            row.addEventListener('mouseenter', () => {
                row.style.transform = 'translateX(5px)';
                row.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            });
            
            row.addEventListener('mouseleave', () => {
                row.style.transform = 'translateX(0)';
                row.style.boxShadow = 'none';
            });
            
            tableBody.appendChild(row);
        });
        
        // Add count animation
        const reportsCount = document.getElementById('reports-count');
        if (reportsCount) {
            reportsCount.classList.add('bounce-animation');
            setTimeout(() => {
                reportsCount.classList.remove('bounce-animation');
            }, 1000);
        }
    }
    // Delete report function
    window.deleteReport = async function(reportId) {
        // Create modern confirmation modal
        const confirmModal = createConfirmModal({
            title: '🗑️ Xác nhận xóa báo cáo',
            message: 'Bạn có chắc chắn muốn xóa báo cáo này không? Hành động này không thể hoàn tác.',
            confirmText: 'Xóa báo cáo',
            cancelText: 'Hủy bỏ',
            type: 'danger'
        });
        
        const confirmed = await showModal(confirmModal);
        if (!confirmed) return;
        
        // Show loading notification
        const loadingNotification = showNotification('🔄 Đang xóa báo cáo...', 'info', 0);
        
        try {
            const response = await fetch(`/api/reports/${reportId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            
            // Hide loading notification
            hideNotification(loadingNotification);
            
            if (response.ok) {
                showNotification('✅ Xóa báo cáo thành công!', 'success', 3000);
                loadReports(); // Reload reports
            } else {
                throw new Error('Không thể xóa báo cáo');
            }
        } catch (error) {
            hideNotification(loadingNotification);
            showNotification('❌ Lỗi: ' + error.message, 'error', 5000);
        }
    };

    // Search functionality with animation
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            // Add typing animation to search input
            searchInput.style.transform = 'scale(1.02)';
            searchInput.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            
            // Clear previous timeout
            clearTimeout(searchTimeout);
            
            // Debounce search with animation
            searchTimeout = setTimeout(() => {
                const filteredReports = allReports.filter(report => 
                    (report.survey?.name || '').toLowerCase().includes(searchTerm) ||
                    (report.survey?.address || '').toLowerCase().includes(searchTerm)
                );
                
                // Add search result animation
                const tableContainer = document.querySelector('.table-modern');
                if (tableContainer) {
                    tableContainer.style.opacity = '0.7';
                    tableContainer.style.transform = 'scale(0.98)';
                    
                    setTimeout(() => {
                        displayReports(filteredReports);
                        tableContainer.style.opacity = '1';
                        tableContainer.style.transform = 'scale(1)';
                        tableContainer.style.transition = 'all 0.3s ease-out';
                    }, 150);
                }
                
                // Reset search input style
                searchInput.style.transform = 'scale(1)';
                searchInput.style.boxShadow = 'none';
                
                // Show search result notification
                if (searchTerm) {
                    showNotification(`🔍 Tìm thấy ${filteredReports.length} kết quả cho "${searchTerm}"`, 'info', 2000);
                }
            }, 300);
        });
        
        // Add focus/blur animations
        searchInput.addEventListener('focus', () => {
            searchInput.style.transform = 'scale(1.02)';
            searchInput.style.transition = 'all 0.2s ease-out';
        });
        
        searchInput.addEventListener('blur', () => {
            searchInput.style.transform = 'scale(1)';
        });
    }

    // Enhanced notification system with animations
    function showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-[99999] transform translate-x-full transition-all duration-500 ${
            type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 
            type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 
            type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white' :
            'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
        }`;
        
        // Add icon based on type
        const icon = type === 'success' ? '✅' : 
                    type === 'error' ? '❌' : 
                    type === 'warning' ? '⚠️' : 'ℹ️';
        
        notification.innerHTML = `
            <div class="flex items-center">
                <div class="flex items-center space-x-3">
                    <div class="text-xl animate-pulse">${icon}</div>
                    <span class="font-medium">${message}</span>
                </div>
                <button onclick="hideNotificationElement(this.parentElement.parentElement)" class="ml-4 text-white hover:text-gray-200 transition-colors duration-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add hover effects
        notification.addEventListener('mouseenter', () => {
            notification.style.transform = 'translateX(-5px) scale(1.02)';
            notification.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
        });
        
        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'translateX(0) scale(1)';
            notification.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
        });
        
        document.body.appendChild(notification);
        
        // Animate in with bounce effect
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
        }, 100);
        
        // Add entrance animation
        setTimeout(() => {
            notification.style.animation = 'bounce 0.6s ease-out';
        }, 200);
        
        // Auto remove with fade out
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    hideNotificationElement(notification);
                }
            }, duration);
        }
        
        return notification;
    }
    
    // Helper function to hide notification with animation
    function hideNotificationElement(notification) {
        if (notification && notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%) scale(0.8)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }
    
    // Make hideNotificationElement globally accessible
    window.hideNotificationElement = hideNotificationElement;

    function hideNotification(notification) {
        if (notification && notification.parentElement) {
            notification.style.transform = 'translateX(full)';
            setTimeout(() => notification.remove(), 300);
        }
    }

    function createConfirmModal({ title, message, confirmText, cancelText, type }) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] backdrop-blur-sm';
        modal.style.opacity = '0';
        modal.style.transition = 'all 0.3s ease-out';
        
        const modalContent = `
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform scale-75 transition-all duration-300 overflow-hidden">
                <div class="bg-gradient-to-r ${
                    type === 'danger' ? 'from-red-500 to-red-600' : 'from-blue-500 to-blue-600'
                } p-4">
                    <div class="flex items-center text-white">
                        <div class="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-3">
                            <i class="fas ${type === 'danger' ? 'fa-exclamation-triangle' : 'fa-question-circle'}"></i>
                        </div>
                        <h3 class="text-lg font-semibold">${title}</h3>
                    </div>
                </div>
                <div class="p-6">
                    <p class="text-gray-600 mb-6 leading-relaxed">${message}</p>
                    <div class="flex justify-end space-x-3">
                        <button id="cancel-btn" class="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 transform hover:scale-105">
                            <i class="fas fa-times mr-2"></i>
                            ${cancelText}
                        </button>
                        <button id="confirm-btn" class="px-6 py-2 text-white rounded-lg transition-all duration-200 transform hover:scale-105 ${
                            type === 'danger' ? 'bg-red-500 hover:bg-red-600 hover:shadow-lg' : 'bg-blue-500 hover:bg-blue-600 hover:shadow-lg'
                        }">
                            <i class="fas ${type === 'danger' ? 'fa-trash' : 'fa-check'} mr-2"></i>
                            ${confirmText}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.innerHTML = modalContent;
        return modal;
    }

    function showModal(modal) {
        return new Promise((resolve) => {
            document.body.appendChild(modal);
            
            // Animate in with staggered effects
            setTimeout(() => {
                modal.style.opacity = '1';
            }, 50);
            
            setTimeout(() => {
                const modalContent = modal.querySelector('div > div');
                modalContent.style.transform = 'scale(1)';
                modalContent.style.animation = 'bounce 0.6s ease-out';
            }, 100);
            
            // Event listeners with animations
            const confirmBtn = modal.querySelector('#confirm-btn');
            const cancelBtn = modal.querySelector('#cancel-btn');
            
            confirmBtn.addEventListener('click', () => {
                // Exit animation
                modal.style.opacity = '0';
                modal.querySelector('div > div').style.transform = 'scale(0.8)';
                setTimeout(() => {
                    modal.remove();
                    resolve(true);
                }, 200);
            });
            
            cancelBtn.addEventListener('click', () => {
                // Exit animation
                modal.style.opacity = '0';
                modal.querySelector('div > div').style.transform = 'scale(0.8)';
                setTimeout(() => {
                    modal.remove();
                    resolve(false);
                }, 200);
            });
            
            // Click outside to close with animation
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.opacity = '0';
                    modal.querySelector('div > div').style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        modal.remove();
                        resolve(false);
                    }, 200);
                }
            });
            
            // Add keyboard support
            const handleKeyPress = (e) => {
                if (e.key === 'Escape') {
                    modal.style.opacity = '0';
                    modal.querySelector('div > div').style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        modal.remove();
                        resolve(false);
                    }, 200);
                    document.removeEventListener('keydown', handleKeyPress);
                } else if (e.key === 'Enter') {
                    confirmBtn.click();
                    document.removeEventListener('keydown', handleKeyPress);
                }
            };
            
            document.addEventListener('keydown', handleKeyPress);
        });
    }

    // Make functions globally accessible
    window.showNotification = showNotification;
    window.hideNotification = hideNotification;
    window.loadReports = loadReports;

    // Initial load
    loadReports();
});
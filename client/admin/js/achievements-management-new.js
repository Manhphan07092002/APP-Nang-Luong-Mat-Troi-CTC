// Achievements Management JavaScript - Database Integration
const API_BASE = window.location.origin;
let currentAchievements = [];
let filteredAchievements = [];
let currentPage = 1;
const achievementsPerPage = 12;
let currentEditingId = null;
let totalPages = 1;
let totalAchievements = 0;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadAchievementStats();
    loadAchievements();
    
    // Add event listeners
    document.getElementById('searchInput').addEventListener('input', debounce(searchAchievements, 300));
    document.getElementById('categoryFilter').addEventListener('change', filterAchievements);
    document.getElementById('rarityFilter').addEventListener('change', filterAchievements);
    document.getElementById('statusFilter').addEventListener('change', filterAchievements);
    
    // Form event listeners
    document.getElementById('addAchievementName').addEventListener('input', updateAchievementPreview);
    document.getElementById('addAchievementIcon').addEventListener('input', updateAchievementPreview);
    document.getElementById('addAchievementColor').addEventListener('input', updateAchievementPreview);
    
    // Initialize preview
    updateAchievementPreview();
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
        return false;
    }
    return true;
}

// Get auth headers
function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    };
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load achievement statistics
async function loadAchievementStats() {
    try {
        const response = await fetch(`${API_BASE}/api/achievements/stats`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '../login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            updateStatsDisplay(result.data);
        } else {
            throw new Error(result.message || 'Failed to load stats');
        }
    } catch (error) {
        console.error('Error loading achievement stats:', error);
        showError('Không thể tải thống kê thành tích');
        // Load fallback stats
        updateStatsDisplay({
            totalAchievements: 0,
            activeAchievements: 0,
            totalAwarded: 0,
            totalUsers: 0
        });
    }
}

// Update stats display
function updateStatsDisplay(stats) {
    document.getElementById('totalAchievements').textContent = stats.totalAchievements || 0;
    document.getElementById('activeAchievements').textContent = stats.activeAchievements || 0;
    document.getElementById('totalAwarded').textContent = stats.totalAwarded || 0;
    document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
}

// Load achievements
async function loadAchievements(page = 1, filters = {}) {
    try {
        showLoading();
        
        // Build query parameters
        const params = new URLSearchParams({
            page: page,
            limit: achievementsPerPage,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            ...filters
        });
        
        const response = await fetch(`${API_BASE}/api/achievements?${params}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '../login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            currentAchievements = result.data;
            filteredAchievements = [...currentAchievements];
            currentPage = result.pagination?.currentPage || 1;
            totalPages = result.pagination?.totalPages || 1;
            totalAchievements = result.pagination?.total || 0;
            
            displayAchievements();
            updatePagination();
        } else {
            throw new Error(result.message || 'Failed to load achievements');
        }
    } catch (error) {
        console.error('Error loading achievements:', error);
        showError('Không thể tải danh sách thành tích');
        currentAchievements = [];
        filteredAchievements = [];
        displayAchievements();
    }
}

// Show loading state
function showLoading() {
    const achievementsGrid = document.getElementById('achievementsGrid');
    achievementsGrid.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
            </div>
            <p class="mt-2 text-muted">Đang tải thành tích...</p>
        </div>
    `;
}

// Show error message
function showError(message) {
    const achievementsGrid = document.getElementById('achievementsGrid');
    achievementsGrid.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
            <p class="text-muted">${message}</p>
            <button class="btn btn-primary" onclick="loadAchievements()">
                <i class="fas fa-redo me-2"></i>Thử lại
            </button>
        </div>
    `;
}

// Display achievements in grid
function displayAchievements() {
    const achievementsGrid = document.getElementById('achievementsGrid');
    
    if (!filteredAchievements || filteredAchievements.length === 0) {
        achievementsGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-trophy text-muted fa-3x mb-3"></i>
                <p class="text-muted">Không có thành tích nào</p>
            </div>
        `;
        return;
    }

    const achievementsHTML = filteredAchievements.map(achievement => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100 achievement-card">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <div class="achievement-icon" style="background: ${achievement.color || '#667eea'};">
                            <i class="${achievement.icon || 'fas fa-trophy'}"></i>
                        </div>
                        <div>
                            <h6 class="mb-1">${achievement.name}</h6>
                            <small class="text-muted">${getRarityText(achievement.rarity)}</small>
                        </div>
                    </div>
                    <p class="card-text small text-muted mb-3">${achievement.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-${getRarityColor(achievement.rarity)}">${achievement.points} điểm</span>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="viewAchievement('${achievement._id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-warning" onclick="editAchievement('${achievement._id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteAchievement('${achievement._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">
                            <i class="fas fa-users me-1"></i>${achievement.completedCount || 0} người đạt
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    achievementsGrid.innerHTML = achievementsHTML;
}

// Get rarity text
function getRarityText(rarity) {
    const rarityMap = {
        'common': 'Phổ biến',
        'uncommon': 'Không phổ biến',
        'rare': 'Hiếm',
        'epic': 'Sử thi',
        'legendary': 'Huyền thoại'
    };
    return rarityMap[rarity] || 'Phổ biến';
}

// Get rarity color
function getRarityColor(rarity) {
    const colorMap = {
        'common': 'secondary',
        'uncommon': 'success',
        'rare': 'info',
        'epic': 'warning',
        'legendary': 'danger'
    };
    return colorMap[rarity] || 'secondary';
}

// Update pagination
function updatePagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Trước</a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Sau</a>
        </li>
    `;
    
    pagination.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    currentPage = page;
    const filters = getFilters();
    loadAchievements(page, filters);
}

// Get current filters
function getFilters() {
    const filters = {};
    
    const search = document.getElementById('searchInput').value.trim();
    if (search) filters.search = search;
    
    const category = document.getElementById('categoryFilter').value;
    if (category) filters.category = category;
    
    const rarity = document.getElementById('rarityFilter').value;
    if (rarity) filters.rarity = rarity;
    
    const status = document.getElementById('statusFilter').value;
    if (status !== '') filters.isActive = status;
    
    return filters;
}

// Search achievements
function searchAchievements() {
    currentPage = 1;
    const filters = getFilters();
    loadAchievements(1, filters);
}

// Filter achievements
function filterAchievements() {
    currentPage = 1;
    const filters = getFilters();
    loadAchievements(1, filters);
}

// Refresh achievements
function refreshAchievements() {
    const filters = getFilters();
    loadAchievements(currentPage, filters);
}

// Update achievement preview
function updateAchievementPreview() {
    const name = document.getElementById('addAchievementName').value || 'Tên thành tích';
    const icon = document.getElementById('addAchievementIcon').value || 'fas fa-trophy';
    const color = document.getElementById('addAchievementColor').value || '#667eea';
    
    const previewIcon = document.getElementById('previewIcon');
    const previewName = document.getElementById('previewName');
    
    if (previewIcon) {
        previewIcon.style.background = color;
        previewIcon.innerHTML = `<i class="${icon}"></i>`;
    }
    
    if (previewName) {
        previewName.textContent = name;
    }
}

// View achievement details
async function viewAchievement(achievementId) {
    try {
        const response = await fetch(`${API_BASE}/api/achievements/${achievementId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            const achievement = result.data;
            
            // Show achievement details in modal
            const modalHTML = `
                <div class="modal fade" id="viewAchievementModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="${achievement.icon}" style="color: ${achievement.color}"></i>
                                    ${achievement.name}
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-8">
                                        <h6>Mô tả</h6>
                                        <p>${achievement.description}</p>
                                        
                                        <h6>Điều kiện</h6>
                                        <p>${achievement.condition || 'Không có điều kiện cụ thể'}</p>
                                        
                                        <div class="row">
                                            <div class="col-md-6">
                                                <h6>Danh mục</h6>
                                                <p>${getCategoryText(achievement.category)}</p>
                                            </div>
                                            <div class="col-md-6">
                                                <h6>Độ hiếm</h6>
                                                <p>${getRarityText(achievement.rarity)}</p>
                                            </div>
                                        </div>
                                        
                                        <div class="row">
                                            <div class="col-md-6">
                                                <h6>Điểm thưởng</h6>
                                                <p>${achievement.points} điểm</p>
                                            </div>
                                            <div class="col-md-6">
                                                <h6>Người đạt được</h6>
                                                <p>${achievement.completedCount || 0} người</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4 text-center">
                                        <div class="achievement-icon mx-auto mb-3" style="background: ${achievement.color}; width: 80px; height: 80px; font-size: 32px;">
                                            <i class="${achievement.icon}"></i>
                                        </div>
                                        <p class="text-muted">Ngày tạo: ${formatDate(achievement.createdAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal
            const existingModal = document.getElementById('viewAchievementModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Add new modal
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('viewAchievementModal'));
            modal.show();
        }
    } catch (error) {
        console.error('Error loading achievement details:', error);
        showNotification('Không thể tải thông tin thành tích', 'error');
    }
}

// Get category text
function getCategoryText(category) {
    const categoryMap = {
        'solar': 'Năng lượng mặt trời',
        'reports': 'Báo cáo',
        'analysis': 'Phân tích',
        'community': 'Cộng đồng',
        'milestone': 'Cột mốc'
    };
    return categoryMap[category] || category;
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('vi-VN');
}

// Edit achievement
async function editAchievement(achievementId) {
    try {
        const response = await fetch(`${API_BASE}/api/achievements/${achievementId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            const achievement = result.data;
            currentEditingId = achievementId;
            
            // Populate edit form
            document.getElementById('editAchievementId').value = achievement._id;
            document.getElementById('editAchievementName').value = achievement.name;
            document.getElementById('editAchievementDescription').value = achievement.description;
            document.getElementById('editAchievementCategory').value = achievement.category;
            document.getElementById('editAchievementRarity').value = achievement.rarity;
            document.getElementById('editAchievementPoints').value = achievement.points;
            document.getElementById('editAchievementIcon').value = achievement.icon;
            document.getElementById('editAchievementColor').value = achievement.color;
            document.getElementById('editAchievementCondition').value = achievement.condition || '';
            
            // Show edit modal
            const modal = new bootstrap.Modal(document.getElementById('editAchievementModal'));
            modal.show();
        }
    } catch (error) {
        console.error('Error loading achievement for edit:', error);
        showNotification('Không thể tải thông tin thành tích để chỉnh sửa', 'error');
    }
}

// Add new achievement
async function addAchievement() {
    try {
        const formData = {
            name: document.getElementById('addAchievementName').value.trim(),
            description: document.getElementById('addAchievementDescription').value.trim(),
            category: document.getElementById('addAchievementCategory').value,
            rarity: document.getElementById('addAchievementRarity').value,
            points: parseInt(document.getElementById('addAchievementPoints').value),
            icon: document.getElementById('addAchievementIcon').value.trim(),
            color: document.getElementById('addAchievementColor').value,
            condition: document.getElementById('addAchievementCondition').value.trim()
        };

        // Validate required fields
        if (!formData.name || !formData.description || !formData.category || !formData.rarity || !formData.points) {
            showNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
            return;
        }

        const response = await fetch(`${API_BASE}/api/achievements`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showNotification('Thêm thành tích thành công!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addAchievementModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('addAchievementForm').reset();
            updateAchievementPreview();
            
            // Reload achievements
            loadAchievements();
            loadAchievementStats();
        } else {
            throw new Error(result.message || 'Failed to create achievement');
        }
    } catch (error) {
        console.error('Error creating achievement:', error);
        showNotification('Không thể tạo thành tích: ' + error.message, 'error');
    }
}

// Update achievement
async function updateAchievement() {
    try {
        if (!currentEditingId) {
            showNotification('Không tìm thấy thành tích để cập nhật', 'error');
            return;
        }

        const formData = {
            name: document.getElementById('editAchievementName').value.trim(),
            description: document.getElementById('editAchievementDescription').value.trim(),
            category: document.getElementById('editAchievementCategory').value,
            rarity: document.getElementById('editAchievementRarity').value,
            points: parseInt(document.getElementById('editAchievementPoints').value),
            icon: document.getElementById('editAchievementIcon').value.trim(),
            color: document.getElementById('editAchievementColor').value,
            condition: document.getElementById('editAchievementCondition').value.trim()
        };

        // Validate required fields
        if (!formData.name || !formData.description || !formData.category || !formData.rarity || !formData.points) {
            showNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
            return;
        }

        const response = await fetch(`${API_BASE}/api/achievements/${currentEditingId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showNotification('Cập nhật thành tích thành công!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editAchievementModal'));
            modal.hide();
            
            // Reset editing state
            currentEditingId = null;
            
            // Reload achievements
            loadAchievements();
            loadAchievementStats();
        } else {
            throw new Error(result.message || 'Failed to update achievement');
        }
    } catch (error) {
        console.error('Error updating achievement:', error);
        showNotification('Không thể cập nhật thành tích: ' + error.message, 'error');
    }
}

// Delete achievement
function deleteAchievement(achievementId) {
    if (confirm('Bạn có chắc chắn muốn xóa thành tích này? Hành động này không thể hoàn tác.')) {
        performDeleteAchievement(achievementId);
    }
}

// Perform delete achievement
async function performDeleteAchievement(achievementId) {
    try {
        const response = await fetch(`${API_BASE}/api/achievements/${achievementId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showNotification('Xóa thành tích thành công!', 'success');
            
            // Reload achievements
            loadAchievements();
            loadAchievementStats();
        } else {
            throw new Error(result.message || 'Failed to delete achievement');
        }
    } catch (error) {
        console.error('Error deleting achievement:', error);
        showNotification('Không thể xóa thành tích: ' + error.message, 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';

    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Logout
function logout() {
    localStorage.removeItem('token');
    window.location.href = '../login.html';
}

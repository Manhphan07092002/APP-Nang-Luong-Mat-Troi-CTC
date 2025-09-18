// Profile Page JavaScript - 2025 Modern Features
document.addEventListener('DOMContentLoaded', function() {
    initializeProfile();
    loadUserData();
    setupEventListeners();
});

// Guard globals to avoid redeclaration if inline scripts already defined them
if (typeof window.isEditMode === 'undefined') window.isEditMode = false;
if (typeof window.currentUser === 'undefined') window.currentUser = null;
if (typeof window.selectedAvatarFile === 'undefined') window.selectedAvatarFile = null; // Track selected avatar file state

// Initialize profile page
function initializeProfile() {
    // Check authentication - use userInfo instead of token for consistency
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const userData = JSON.parse(userInfo);
        if (!userData.token) {
            throw new Error('Invalid user data - no token');
        }
    } catch (error) {
        console.error('Invalid userInfo data:', error);
        localStorage.removeItem('userInfo');
        window.location.href = '/login.html';
        return;
    }
    
    // Load user data from token or API
    loadUserProfile();
    
    // Setup theme persistence
    const savedTheme = localStorage.getItem('profileTheme');
    if (savedTheme) {
        document.body.style.background = savedTheme;
    }
}

// Load user profile data from MongoDB
async function loadUserProfile() {
    try {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            throw new Error('No user info found');
        }
        
        const userData = JSON.parse(userInfo);
        const token = userData.token;
        
        if (!token) {
            throw new Error('No token found');
        }
        
        const response = await fetch('/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const profileData = await response.json();
            window.currentUser = profileData;
            populateProfileData(profileData);
            updatePersonalizedContent(profileData);
            
            // Update avatar image if it exists in database
            if (profileData.profileImage) {
                const avatarImg = document.getElementById('avatarImage');
                if (avatarImg) {
                    avatarImg.src = profileData.profileImage;
                    console.log('Avatar loaded from database');
                }
            }
            
            showNotification('Đã tải thông tin profile từ cơ sở dữ liệu', 'success');
        } else {
            console.error('Failed to load profile:', response.status);
            // Use demo data if API not available
            loadDemoData();
            showNotification('Đang sử dụng dữ liệu demo', 'warning');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        loadDemoData();
        showNotification('Lỗi kết nối - sử dụng dữ liệu demo', 'error');
    }
}

// Populate profile with comprehensive user data from MongoDB
function populateProfileData(user) {
    // Basic profile information
    document.getElementById('userName').textContent = user.name || 'Người dùng';
    document.getElementById('userTitle').textContent = user.position || 'Solar Analytics Engineer';
    
    // Form fields
    const fields = {
        'fullName': user.name,
        'email': user.email,
        'phone': user.phone,
        'position': user.position,
        'company': user.company,
        'address': user.address,
        'bio': user.bio
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const profileImage = document.getElementById('profileImage');
        const formAvatarPreview = document.getElementById('form-avatar-preview');
        const imageUrl = user.profileImage || '/assets/images/default-user.png';
        if (profileImage) {
            profileImage.src = imageUrl;
        }
        if (formAvatarPreview) {
            formAvatarPreview.src = imageUrl;
        }
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = value || '';
            element.placeholder = value ? value : (fieldId === 'phone' || fieldId === 'company' || fieldId === 'address' || fieldId === 'bio' ? 'Chưa cập nhật' : 'Đang tải...');
        } else {
            console.warn(`Profile field element not found: ${fieldId}`);
        }
    });
    
    // Additional profile fields
    if (user.dateOfBirth) {
        const dobElement = document.getElementById('dateOfBirth');
        if (dobElement) dobElement.value = user.dateOfBirth.split('T')[0];
    }
    
    if (user.gender) {
        const genderElement = document.getElementById('gender');
        if (genderElement) genderElement.value = user.gender;
    }
    
    // Update avatar dynamically
    const avatarImage = document.getElementById('avatarImage');
    const formAvatarPreview = document.getElementById('form-avatar-preview');
    const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    const fallbackSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%234F46E5'/%3E%3Ctext x='75' y='85' text-anchor='middle' fill='white' font-size='48' font-family='Arial'%3E${userInitial}%3C/text%3E%3C/svg%3E`;
    const imageUrl = user.profileImage || fallbackSvg;

    if (avatarImage) {
        avatarImage.src = imageUrl;
        avatarImage.onerror = function() { this.src = fallbackSvg; };
    }
    if (formAvatarPreview) {
        formAvatarPreview.src = imageUrl;
        formAvatarPreview.onerror = function() { this.src = fallbackSvg; };
    }
    
    // Update dynamic badges
    updateUserBadges(user);
    
    // Update comprehensive stats
    updateUserStats(user);
    
    // Update member info
    updateMembershipInfo(user);
    
    // Update AI suggestions based on user data
    updateAISuggestions(user);
}

// Load demo data for testing (fallback when MongoDB is not available)
function loadDemoData() {
    const demoUser = {
        _id: 'demo-user-id',
        name: 'Demo User',
        email: 'demo@solaranalytics.com',
        phone: '+84 123 456 789',
        position: 'Senior Solar Analytics Engineer',
        company: 'Solar Analytics Vietnam',
        address: '123 Nguyễn Trãi, Quận 1, TP.HCM',
        bio: 'Chuyên gia phân tích năng lượng mặt trời với 5 năm kinh nghiệm. Đam mê công nghệ xanh và phát triển bền vững.',
        profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        dateOfBirth: '1990-01-15',
        gender: 'male',
        role: 'user',
        stats: {
            projectsCompleted: 24,
            reportsGenerated: 156,
            experienceYears: 5,
            achievementsEarned: 12,
            totalLoginDays: 45,
            lastActivityDate: new Date().toISOString()
        },
        preferences: {
            theme: 'auto',
            language: 'vi',
            notifications: {
                email: true,
                browser: true,
                reports: true
            },
            dashboard: {
                layout: 'grid',
                widgets: ['stats', 'recent-reports', 'activities']
            }
        },
        socialProviders: {
            google: false,
            facebook: false
        },
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        memberSince: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
        isActive: true
    };
    
    window.currentUser = demoUser;
    populateProfileData(demoUser);
    updatePersonalizedContent(demoUser);
}

// Update user statistics with MongoDB data
function updateUserStats(user) {
    const stats = user.stats || {
        projectsCompleted: 0,
        reportsGenerated: 0,
        experienceYears: 1,
        achievementsEarned: 0
    };
    
    // Update stat cards with real data
    const statElements = {
        'projectCount': stats.projectsCompleted || 0,
        'reportCount': stats.reportsGenerated || 0,
        'experienceYears': stats.experienceYears || 1,
        'achievementCount': stats.achievementsEarned || 0
    };
    
    Object.entries(statElements).forEach(([elementId, value]) => {
        const element = document.getElementById(elementId);
        if (element) {
            // Animate number counting
            animateNumber(element, parseInt(element.textContent) || 0, value, 1000);
        }
    });
    
    // Update activity timeline with real data
    updateActivityTimeline(user);
}

// Update membership information with MongoDB data
function updateMembershipInfo(user) {
    // Update member since date
    if (user.memberSince || user.createdAt) {
        const memberSinceElement = document.getElementById('memberSince');
        if (memberSinceElement) {
            const memberDate = new Date(user.memberSince || user.createdAt);
            memberSinceElement.innerHTML = `<i class="fas fa-calendar-alt mr-2"></i>Thành viên từ ${memberDate.toLocaleDateString('vi-VN')}`;
        }
    }
    
    // Update last login
    if (user.lastLogin || user.stats?.lastActivityDate) {
        const lastLoginElement = document.getElementById('lastLogin');
        if (lastLoginElement) {
            const lastLogin = new Date(user.lastLogin || user.stats.lastActivityDate);
            const timeAgo = formatRelativeTime(lastLogin);
            lastLoginElement.innerHTML = `<i class="fas fa-clock mr-2"></i>Đăng nhập lần cuối: ${timeAgo}`;
        }
    }
    
    // Update social provider status
    updateSocialProviderStatus(user.socialProviders || {});
    
    // Update avatar URL field
    if (user.profileImage) {
        const avatarUrlElement = document.getElementById('avatarUrl');
        if (avatarUrlElement) {
            avatarUrlElement.value = user.profileImage;
        }
    }
}

// Update social provider status from MongoDB data
function updateSocialProviderStatus(socialProviders = {}) {
    // Update Google status
    const googleStatusElement = document.getElementById('googleStatus');
    if (googleStatusElement) {
        const googleConnected = socialProviders.google || false;
        const googleSpan = googleStatusElement.querySelector('span');
        if (googleSpan) {
            googleSpan.innerHTML = googleConnected 
                ? '<span class="text-green-400">Google: Đã liên kết</span>'
                : '<span class="text-white text-opacity-80">Google: Chưa liên kết</span>';
        }
        
        // Update icon color based on connection status
        const googleIcon = googleStatusElement.querySelector('i');
        if (googleIcon) {
            googleIcon.className = googleConnected 
                ? 'fab fa-google text-green-500' 
                : 'fab fa-google text-red-500';
        }
    }
    
    // Update Facebook status
    const facebookStatusElement = document.getElementById('facebookStatus');
    if (facebookStatusElement) {
        const facebookConnected = socialProviders.facebook || false;
        const facebookSpan = facebookStatusElement.querySelector('span');
        if (facebookSpan) {
            facebookSpan.innerHTML = facebookConnected 
                ? '<span class="text-green-400">Facebook: Đã liên kết</span>'
                : '<span class="text-white text-opacity-80">Facebook: Chưa liên kết</span>';
        }
        
        // Update icon color based on connection status
        const facebookIcon = facebookStatusElement.querySelector('i');
        if (facebookIcon) {
            facebookIcon.className = facebookConnected 
                ? 'fab fa-facebook text-green-500' 
                : 'fab fa-facebook text-blue-500';
        }
    }
}

// Update personalized content based on user data
function updatePersonalizedContent(user) {
    // Update AI suggestions based on user activity
    generatePersonalizedSuggestions(user);
    
    // Update theme based on user preferences
    if (user.preferences && user.preferences.theme) {
        applyUserTheme(user.preferences.theme);
    }
    
    // Update dashboard widgets preference
    if (user.preferences && user.preferences.dashboard) {
        updateDashboardPreferences(user.preferences.dashboard);
    }
}

// Generate personalized AI suggestions
function generatePersonalizedSuggestions(user) {
    const suggestions = [];
    const stats = user.stats || {};
    
    if (stats.reportsGenerated < 5) {
        suggestions.push({
            icon: 'fa-file-alt',
            text: 'Tạo báo cáo đầu tiên của bạn',
            action: 'create-report'
        });
    }
    
    if (stats.projectsCompleted < 3) {
        suggestions.push({
            icon: 'fa-project-diagram',
            text: 'Khám phá các dự án mẫu',
            action: 'explore-projects'
        });
    }
    
    if (!user.profileImage || user.profileImage.includes('unsplash')) {
        suggestions.push({
            icon: 'fa-user-circle',
            text: 'Cập nhật ảnh đại diện cá nhân',
            action: 'update-avatar'
        });
    }
    
    if (suggestions.length > 0) {
        displayAISuggestions(suggestions);
    }
}

// Display AI suggestions
function displayAISuggestions(suggestions) {
    const suggestionContainer = document.querySelector('.ai-suggestion .flex.gap-2');
    if (suggestionContainer && suggestions.length > 0) {
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        suggestionContainer.innerHTML = `
            <i class="fas ${randomSuggestion.icon} mr-2"></i>
            ${randomSuggestion.text}
        `;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Floating action button
    document.getElementById('floatingAction').addEventListener('click', showAISuggestion);
    
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Auto-save functionality
    setupAutoSave();

    // Main profile action buttons
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    if (editBtn) editBtn.addEventListener('click', toggleEditMode);
    if (saveBtn) saveBtn.addEventListener('click', saveProfile);
    if (cancelBtn) cancelBtn.addEventListener('click', cancelEdit);

    // Avatar viewer modal logic
    const avatarViewerModal = document.getElementById('avatar-viewer-modal');
    const closeAvatarViewer = document.getElementById('close-avatar-viewer');
    const avatarViewerImage = document.getElementById('avatar-viewer-image');
    const mainAvatarImage = document.getElementById('profileImage');

    const formAvatarPreview = document.getElementById('form-avatar-preview');

    if (mainAvatarImage) {
        mainAvatarImage.addEventListener('click', () => {
            if (avatarViewerImage && avatarViewerModal) {
                avatarViewerImage.src = mainAvatarImage.src;
                avatarViewerModal.classList.remove('hidden');
                avatarViewerModal.classList.add('flex');
            }
        });
    }

    if (closeAvatarViewer) {
        closeAvatarViewer.addEventListener('click', () => {
            if (avatarViewerModal) {
                avatarViewerModal.classList.add('hidden');
                avatarViewerModal.classList.remove('flex');
            }
        });
    }

    if (formAvatarPreview) {
        formAvatarPreview.addEventListener('click', () => {
            if (avatarViewerImage && avatarViewerModal) {
                avatarViewerImage.src = formAvatarPreview.src;
                avatarViewerModal.classList.remove('hidden');
                avatarViewerModal.classList.add('flex');
            }
        });
    }

    if (avatarViewerModal) {
        avatarViewerModal.addEventListener('click', (e) => {
            if (e.target === avatarViewerModal) {
                avatarViewerModal.classList.add('hidden');
                avatarViewerModal.classList.remove('flex');
            }
        });
    }

    // Avatar upload logic
    const avatarFileInput = document.getElementById('avatarFileInput');
    const changeAvatarBtnNew = document.getElementById('changeAvatarBtn_new');

    if (changeAvatarBtnNew && avatarFileInput) {
        changeAvatarBtnNew.addEventListener('click', () => {
            avatarFileInput.click();
        });

        avatarFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            window.selectedAvatarFile = file; // Store file for later upload
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target.result;
                const mainAvatar = document.getElementById('avatarImage');
                const formPreview = document.getElementById('form-avatar-preview');
                if (mainAvatar) mainAvatar.src = dataUrl;
                if (formPreview) formPreview.src = dataUrl;
            };
            reader.readAsDataURL(file);
        });
    }
}

// Refresh profile data from database (without notification)
async function refreshProfileFromDatabase() {
    try {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) return;
        
        const userData = JSON.parse(userInfo);
        const token = userData.token;
        
        const response = await fetch('/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const profileData = await response.json();
            window.currentUser = profileData;
            
            // Update avatar image if it exists
            if (profileData.profileImage) {
                const avatarImg = document.getElementById('avatarImage');
                if (avatarImg) {
                    avatarImg.src = profileData.profileImage;
                }
            }
            
            console.log('Profile data refreshed from database');
        }
    } catch (error) {
        console.error('Error refreshing profile:', error);
    }
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Toggle edit mode
function toggleEditMode() {
    window.isEditMode = !window.isEditMode;

    const inputs = document.querySelectorAll('.modern-input');
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const changeAvatarBtnNew = document.getElementById('changeAvatarBtn_new');

    // Toggle readonly state for all inputs
    inputs.forEach(input => {
        if (input.id === 'email') return; // Email should not be editable
        input.readOnly = !window.isEditMode;
        if (window.isEditMode) {
            input.classList.add('editable-field');
            input.classList.remove('readonly-field');
        } else {
            input.classList.remove('editable-field');
            input.classList.add('readonly-field');
        }
    });

    // Toggle button visibility
    if (window.isEditMode) {
        editBtn.classList.add('hidden');
        saveBtn.classList.remove('hidden');
        cancelBtn.classList.remove('hidden');
        if (changeAvatarBtnNew) changeAvatarBtnNew.classList.remove('hidden');
        showNotification('Chế độ chỉnh sửa đã bật', 'info');
    } else {
        editBtn.classList.remove('hidden');
        saveBtn.classList.add('hidden');
        cancelBtn.classList.add('hidden');
        if (changeAvatarBtnNew) changeAvatarBtnNew.classList.add('hidden');
        showNotification('Đã tắt chế độ chỉnh sửa', 'info');
    }
}

// A new function to handle avatar upload as part of the main save process
// Update all avatar instances across the UI
function updateAllAvatarInstances(newAvatarUrl) {
    if (!newAvatarUrl) return;

    const avatarElements = [
        document.getElementById('avatarImage'),
        document.getElementById('form-avatar-preview'),
        document.getElementById('header-user-avatar'), // For header
        document.getElementById('dropdown-user-avatar') // For dropdown menu
    ];

    avatarElements.forEach(el => {
        if (el) {
            el.src = newAvatarUrl;
        }
    });

    // Update localStorage to persist the change across the app
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo) {
            // The structure might be nested, handle both cases
            if (userInfo.user) {
                userInfo.user.profileImage = newAvatarUrl;
            } else {
                userInfo.profileImage = newAvatarUrl;
            }
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
        }
    } catch (error) {
        console.error('Failed to update userInfo in localStorage:', error);
    }
    
    // Also update the global currentUser object
    if(window.currentUser) {
        window.currentUser.profileImage = newAvatarUrl;
    }
}

// A new function to handle avatar upload as part of the main save process
async function uploadAndSaveAvatar(file) {
    if (!file) return { success: true }; // Nothing to upload

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const token = userInfo ? userInfo.token : null;
        if (!token) {
            showNotification('Authentication token not found.', 'error');
            return { success: false };
        }

        const response = await fetch('/api/users/profile/avatar', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        if (response.ok && data.success) {
            showNotification('Avatar updated successfully!', 'success');
            window.selectedAvatarFile = null; // Clear the file after successful upload
            return { success: true, filePath: data.filePath };
        } else {
            throw new Error(data.message || 'Failed to upload avatar.');
        }
    } catch (error) {
        showNotification(error.message || 'Error saving avatar.', 'error');
        return { success: false };
    }
}

async function saveProfile() {
    const loadingBtn = event.target;
    const originalText = loadingBtn.innerHTML;
    loadingBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang lưu...';
    loadingBtn.disabled = true;

    try {
        // Collect all form data including new fields
        const updatedData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            bio: document.getElementById('bio').value,
            company: document.getElementById('company').value,
            position: document.getElementById('position').value,
            gender: document.getElementById('gender').value,
            dateOfBirth: document.getElementById('dateOfBirth').value,
        };

        // Validate required fields
        if (!updatedData.fullName || !updatedData.email) {
            showNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'warning');
            loadingBtn.innerHTML = originalText;
            loadingBtn.disabled = false;
            return;
        }

        // First, handle avatar upload if a new one is selected
        if (window.selectedAvatarFile) {
            const uploadResult = await uploadAndSaveAvatar(window.selectedAvatarFile);
            if (!uploadResult.success) {
                // Stop the save process if avatar upload fails
                loadingBtn.innerHTML = originalText;
                loadingBtn.disabled = false;
                return;
            }
            // If upload is successful and we have a new path, update all avatars
            if (uploadResult.filePath) {
                updateAllAvatarInstances(uploadResult.filePath);
                updatedData.profileImage = uploadResult.filePath; // Add new avatar path to the update object
            }
        }

        // Show loading state
        const saveButton = document.querySelector('.save-btn');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang lưu...';
            saveButton.disabled = true;
        }

        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token) {
            showNotification('Không tìm thấy thông tin xác thực. Vui lòng đăng nhập lại.', 'error');
            if (saveButton) {
                saveButton.innerHTML = 'Lưu thay đổi';
                saveButton.disabled = false;
            }
            return;
        }
        const token = userInfo.token;

        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            const result = await response.json();
            // Ensure result.user exists before spreading
            if (result.user) {
                window.currentUser = { ...window.currentUser, ...result.user };
            } else {
                // If the response doesn't nest the user, use the result directly
                window.currentUser = { ...window.currentUser, ...result };
            }

            // Update display with new data
            populateProfileData(window.currentUser);

            // Update activity stats if function exists
            if (typeof updateUserActivity === 'function') {
                await updateUserActivity('profile_update');
            }

            // Exit edit mode
            toggleEditMode();

            // Clear draft
            localStorage.removeItem('profileDraft');

            showNotification(result.message || 'Cập nhật profile thành công!', 'success');
        } else {
            const error = await response.json();
            showNotification(error.message || 'Lỗi khi cập nhật profile', 'error');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        showNotification('Có lỗi xảy ra khi lưu thông tin', 'error');
    } finally {
        // Reset save button
        const saveButton = document.querySelector('.save-btn');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-save mr-2"></i>Lưu thay đổi';
            saveButton.disabled = false;
        }
    }
}

// Cancel edit mode
function cancelEdit() {
    if (window.currentUser) {
        populateProfileData(window.currentUser);
    }
    toggleEditMode();
    showNotification('Đã hủy chỉnh sửa', 'info');
}

// Update user badges dynamically based on MongoDB data
function updateUserBadges(user) {
    const badgesContainer = document.getElementById('userBadges');
    if (!badgesContainer) return;

    let badges = [];

    // Role-based badges
    if (user.role === 'admin') {
        badges.push('<span class="px-3 py-1 bg-red-500 bg-opacity-80 rounded-full text-white text-sm"><i class="fas fa-crown mr-1"></i>Admin</span>');
    } else if (user.role === 'premium') {
        badges.push('<span class="px-3 py-1 bg-yellow-500 bg-opacity-80 rounded-full text-white text-sm"><i class="fas fa-star mr-1"></i>Premium</span>');
    }

    // Activity status badge
    if (user.isActive) {
        badges.push('<span class="px-3 py-1 bg-green-500 bg-opacity-80 rounded-full text-white text-sm"><i class="fas fa-check-circle mr-1"></i>Active</span>');
    }

    // Social provider badges
    if (user.socialProviders?.google) {
        badges.push('<span class="px-3 py-1 bg-blue-500 bg-opacity-80 rounded-full text-white text-sm"><i class="fab fa-google mr-1"></i>Google</span>');
    }
    if (user.socialProviders?.facebook) {
        badges.push('<span class="px-3 py-1 bg-blue-600 bg-opacity-80 rounded-full text-white text-sm"><i class="fab fa-facebook mr-1"></i>Facebook</span>');
    }

    // Experience-based badges
    const experienceYears = user.stats?.experienceYears || 0;
    if (experienceYears >= 5) {
        badges.push('<span class="px-3 py-1 bg-purple-500 bg-opacity-80 rounded-full text-white text-sm"><i class="fas fa-trophy mr-1"></i>Expert</span>');
    } else if (experienceYears >= 2) {
        badges.push('<span class="px-3 py-1 bg-blue-500 bg-opacity-80 rounded-full text-white text-sm"><i class="fas fa-medal mr-1"></i>Professional</span>');
    }

    // Achievement-based badges
    const achievements = user.stats?.achievementsEarned || 0;
    if (achievements >= 10) {
        badges.push('<span class="px-3 py-1 bg-orange-500 bg-opacity-80 rounded-full text-white text-sm"><i class="fas fa-award mr-1"></i>Top Achiever</span>');
    }

    // Default badge if no specific badges
    if (badges.length === 0) {
        badges.push('<span class="px-3 py-1 bg-white bg-opacity-20 rounded-full text-white text-sm"><i class="fas fa-user mr-1"></i>Member</span>');
    }

    badgesContainer.innerHTML = badges.join(' ');
}

// Update AI suggestions based on user data and activity
function updateAISuggestions(user) {
    const suggestionsContainer = document.getElementById('aiSuggestions');
    if (!suggestionsContainer) return;

    let suggestions = [];
    const stats = user.stats || {};

    // Suggestions based on user activity
    if ((stats.projectsCompleted || 0) < 5) {
        suggestions.push('<div class="bg-white bg-opacity-10 rounded-lg p-3"><i class="fas fa-project-diagram mr-2"></i>Tạo dự án đầu tiên của bạn</div>');
    } else if ((stats.reportsGenerated || 0) < 10) {
        suggestions.push('<div class="bg-white bg-opacity-10 rounded-lg p-3"><i class="fas fa-chart-line mr-2"></i>Tạo báo cáo phân tích chi tiết</div>');
    }

    // Profile completion suggestions
    if (!user.bio) {
        suggestions.push('<div class="bg-white bg-opacity-10 rounded-lg p-3"><i class="fas fa-edit mr-2"></i>Hoàn thiện thông tin cá nhân</div>');
    }

    if (!user.company) {
        suggestions.push('<div class="bg-white bg-opacity-10 rounded-lg p-3"><i class="fas fa-building mr-2"></i>Cập nhật thông tin công ty</div>');
    }

    // Social connection suggestions
    if (!user.socialProviders?.google && !user.socialProviders?.facebook) {
        suggestions.push('<div class="bg-white bg-opacity-10 rounded-lg p-3"><i class="fas fa-link mr-2"></i>Liên kết tài khoản mạng xã hội</div>');
    }

    // Experience-based suggestions
    if ((stats.experienceYears || 0) >= 3 && (stats.achievementsEarned || 0) < 5) {
        suggestions.push('<div class="bg-white bg-opacity-10 rounded-lg p-3"><i class="fas fa-trophy mr-2"></i>Khám phá thêm thành tựu mới</div>');
    }

    // Default suggestions if none specific
    if (suggestions.length === 0) {
        suggestions = [
            '<div class="bg-white bg-opacity-10 rounded-lg p-3"><i class="fas fa-chart-line mr-2"></i>Khám phá dashboard analytics</div>',
            '<div class="bg-white bg-opacity-10 rounded-lg p-3"><i class="fas fa-users mr-2"></i>Kết nối với cộng đồng</div>'
        ];
    }

    // Limit to 4 suggestions max
    suggestions = suggestions.slice(0, 4);

    suggestionsContainer.innerHTML = suggestions.join('');
}

// This function is now obsolete as it cycles through demo images.
function changeAvatar_legacy() {
    const avatars = [
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face'
    ];

    const currentSrc = document.getElementById('avatarImage').src;
    const currentIndex = avatars.findIndex(avatar => currentSrc.includes(avatar.split('?')[0].split('/').pop()));
    const nextIndex = (currentIndex + 1) % avatars.length;

    document.getElementById('avatarImage').src = avatars[nextIndex];

    // Add animation effect
    const avatar = document.getElementById('profileAvatar');
    avatar.style.transform = 'scale(0.9) rotate(180deg)';
    setTimeout(() => {
        avatar.style.transform = 'scale(1) rotate(0deg)';
    }, 300);

    showNotification('Đã thay đổi ảnh đại diện!', 'success');
}

// Toggle theme
function toggleTheme() {
    const themes = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    ];

    const currentBg = document.body.style.background;
    let currentIndex = themes.findIndex(theme => currentBg.includes(theme.split('(')[1].split(',')[0]));
    if (currentIndex === -1) currentIndex = 0;

    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];

    document.body.style.background = newTheme;
    localStorage.setItem('profileTheme', newTheme);

    // Add transition effect
    document.body.style.transition = 'background 0.5s ease';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 500);

    showNotification('Đã thay đổi giao diện!', 'success');
}

// Show AI suggestion
function showAISuggestion() {
    const suggestions = [
        'Tạo báo cáo phân tích mới cho dự án solar farm',
        'Kiểm tra hiệu suất các panel năng lượng mặt trời',
        'Lên lịch bảo trì định kỳ cho hệ thống',
        'Phân tích dữ liệu thời tiết và tối ưu hóa năng suất',
        'Tạo presentation cho khách hàng về ROI',
        'Cập nhật kỹ năng với khóa học AI mới',
        'Kết nối với các chuyên gia trong ngành',
        'Tối ưu hóa quy trình làm việc hiện tại'
    ];

    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

    // Create floating suggestion
    const suggestionEl = document.createElement('div');
    suggestionEl.className = 'fixed bottom-24 right-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg max-w-sm z-50 transform translate-x-full transition-transform duration-300';
    suggestionEl.innerHTML = `
        <div class="flex items-start gap-3">
            <i class="fas fa-lightbulb text-yellow-300 mt-1"></i>
            <div>
                <div class="font-semibold mb-1">💡 AI Gợi ý</div>
                <div class="text-sm">${randomSuggestion}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(suggestionEl);

    setTimeout(() => {
        suggestionEl.classList.remove('translate-x-full');
    }, 100);

    setTimeout(() => {
        if (suggestionEl.parentElement) {
            suggestionEl.classList.add('translate-x-full');
            setTimeout(() => {
                if (suggestionEl.parentElement) {
                    suggestionEl.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';

    const icon = type === 'success' ? 'fa-check' :
        type === 'error' ? 'fa-times' :
            type === 'warning' ? 'fa-exclamation' : 'fa-info';

    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white transform translate-x-full transition-transform duration-300 ${bgColor}`;
    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <i class="fas ${icon} mr-2"></i>
            ${message}
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);

    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + E for edit mode
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        toggleEditMode();
    }

    // Ctrl/Cmd + S for save
    if ((event.ctrlKey || event.metaKey) && event.key === 's' && window.isEditMode) {
        event.preventDefault();
        saveProfile();
    }

    // Escape to cancel edit
    if (event.key === 'Escape' && window.isEditMode) {
        cancelEdit();
    }

    // Ctrl/Cmd + T for theme toggle
    if ((event.ctrlKey || event.metaKey) && event.key === 't') {
        event.preventDefault();
        toggleTheme();
    }
}

// Setup auto-save functionality
function setupAutoSave() {
    const inputs = document.querySelectorAll('.modern-input');
    let autoSaveTimeout;

    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (window.isEditMode) {
                clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(() => {
                    // Auto-save draft to localStorage
                    saveDraftData();
                }, 1000);
            }
        });
    });
}

// Save draft data to localStorage (auto-save)
function saveDraftData() {
    try {
        const draftData = {
            name: document.getElementById('fullName')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            position: document.getElementById('position')?.value || '',
            address: document.getElementById('address')?.value || '',
            bio: document.getElementById('bio')?.value || '',
            company: document.getElementById('company')?.value || '',
            dateOfBirth: document.getElementById('dateOfBirth')?.value || '',
            gender: document.getElementById('gender')?.value || '',
            timestamp: Date.now()
        };
        localStorage.setItem('profileDraft', JSON.stringify(draftData));
    } catch (e) {
        console.warn('Auto-save draft failed:', e);
    }
}

// Load draft data if available
function loadDraftData() {
    const draft = localStorage.getItem('profileDraft');
    if (draft) {
        const draftData = JSON.parse(draft);
        // Check if draft is less than 1 hour old
        if (Date.now() - draftData.timestamp < 3600000) {
            const shouldLoad = confirm('Có bản nháp chưa lưu. Bạn có muốn khôi phục không?');
            if (shouldLoad) {
                populateProfileData(draftData);
                toggleEditMode();
                showNotification('Đã khôi phục bản nháp', 'info');
            }
        }
        localStorage.removeItem('profileDraft');
    }
}

// Update header user info
function updateHeaderUserInfo(userData) {
    // This will be called by the header.js when it loads
    if (window.updateHeaderProfile) {
        window.updateHeaderProfile(userData);
    }
}

// Update user activity statistics
async function updateUserActivity(action, value = 1) {
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token) {
            console.error('Authentication token not found for updateUserActivity');
            return;
        }
        const token = userInfo.token;

        const response = await fetch('/api/users/stats', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ action, value })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (window.currentUser) {
                window.currentUser.stats = result.stats;
                updateUserStats(window.currentUser);
            }
        }
    } catch (error) {
        console.error('Error updating user activity:', error);
    }
}

// Show/hide loading overlay
function showLoading(isLoading) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        if (isLoading) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Reset avatar button to its default state
function resetAvatarButton() {
    const changeBtn = document.getElementById('changeAvatarBtn');
    if (changeBtn) {
        changeBtn.innerHTML = '<i class="fas fa-camera mr-2"></i>Chọn ảnh từ máy';
        changeBtn.disabled = false;
        delete changeBtn.dataset.state;
    }
    window.selectedAvatarFile = null;
    const fileInput = document.getElementById('avatarFileInput');
    if (fileInput) {
        fileInput.value = '';
    }
}

// Save avatar image
async function saveAvatarImage(file) {
    if (!file) {
        showNotification('Vui lòng chọn một file ảnh trước khi lưu.', 'warning');
        return;
    }

    console.log('Attempting to save avatar via file upload...');

    const formData = new FormData();
    formData.append('avatar', file);

    showLoading(true);
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token) {
            throw new Error('User not authenticated.');
        }
        const token = userInfo.token;

        const response = await fetch('/api/users/profile/avatar', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
                // NOTE: 'Content-Type' header is intentionally omitted.
                // The browser will automatically set it to 'multipart/form-data'
                // with the correct boundary when sending a FormData object.
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('Avatar updated successfully via file upload.');
            showNotification(data.message || 'Cập nhật ảnh đại diện thành công!', 'success');
            resetAvatarButton(); // Reset button only on success
            await refreshProfileFromDatabase(); // Refresh profile data to show new avatar
        } else {
            throw new Error(data.message || 'Lỗi không xác định từ server.');
        }
    } catch (error) {
        console.error('Error saving avatar:', error);
        showNotification(error.message || 'Có lỗi xảy ra khi lưu ảnh.', 'error');
        // Do not reset the button on error, so the user can try again.
    } finally {
        showLoading(false);
    }
}

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}


// Format relative time
function formatRelativeTime(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
}


// Apply user theme preference
function applyUserTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (theme === 'light') {
        document.body.classList.remove('dark-theme');
    }
    // 'auto' theme will use system preference
}

// Update dashboard preferences
function updateDashboardPreferences(dashboardPrefs) {
    if (dashboardPrefs.layout) {
        localStorage.setItem('dashboardLayout', dashboardPrefs.layout);
    }
    if (dashboardPrefs.widgets) {
        localStorage.setItem('dashboardWidgets', JSON.stringify(dashboardPrefs.widgets));
    }
}

// Update activity timeline with real data
function updateActivityTimeline(user) {
    const activityContainer = document.querySelector('.activity-timeline');
    if (!activityContainer) return;
    
    const activities = [
        {
            icon: 'fa-sign-in-alt',
            text: 'Đăng nhập hệ thống',
            time: user.lastLogin ? formatRelativeTime(new Date(user.lastLogin)) : 'Chưa xác định',
            color: 'text-green-400'
        },
        {
            icon: 'fa-user-edit',
            text: 'Cập nhật profile',
            time: user.stats?.lastActivityDate ? formatRelativeTime(new Date(user.stats.lastActivityDate)) : 'Chưa có hoạt động',
            color: 'text-blue-400'
        },
        {
            icon: 'fa-chart-line',
            text: `Đã tạo ${user.stats?.reportsGenerated || 0} báo cáo`,
            time: 'Tổng kết',
            color: 'text-purple-400'
        }
    ];
    
    const timelineHTML = activities.map(activity => `
        <div class="activity-item p-3">
            <div class="flex items-center gap-3">
                <i class="fas ${activity.icon} ${activity.color}"></i>
                <div>
                    <div class="text-white text-sm font-medium">${activity.text}</div>
                    <div class="text-white text-opacity-60 text-xs">${activity.time}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    activityContainer.innerHTML = timelineHTML;
}

// Export functions for global access
window.profileFunctions = {
    toggleEditMode,
    saveProfile,
    cancelEdit,
    changeAvatar,
    toggleTheme,
    showAISuggestion,
    updateUserActivity,
    loadUserProfile
};

function cancelEdit() {
    // Revert any changes by reloading the original data
    loadUserProfile();
    // Exit edit mode
    if (window.isEditMode) {
        toggleEditMode();
    }
    showNotification('Đã hủy các thay đổi', 'warning');
}

// Load user data on page load
function loadUserData() {
    loadDraftData();
}

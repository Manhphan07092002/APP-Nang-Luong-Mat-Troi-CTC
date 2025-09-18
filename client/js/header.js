// Enhanced Header JavaScript with User Profile Dropdown - 2025
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Header.js: DOM Content Loaded');
    
    // Initialize with multiple fallback mechanisms
    initializeHeaderWithRetry();
    
    // Listen for header loaded events
    window.addEventListener('headerLoaded', function() {
        console.log('📡 Header.js: Received headerLoaded event');
        setTimeout(() => {
            initializeAuth();
            setupProfileDropdown();
            setupMobileMenu();
        }, 50);
    });
});

// Initialize header with retry mechanism
function initializeHeaderWithRetry() {
    let attempts = 0;
    const maxAttempts = 10;
    const retryInterval = 200;
    
    function tryInitialize() {
        attempts++;
        console.log(`🔄 Header.js: Initialization attempt ${attempts}/${maxAttempts}`);
        
        const headerContainer = document.getElementById('header-container');
        const authButtons = document.getElementById('auth-buttons');
        const profileDropdown = document.getElementById('profile-dropdown');
        
        if (headerContainer && headerContainer.innerHTML.trim() && (authButtons || profileDropdown)) {
            console.log('✅ Header.js: Header elements found, initializing...');
            initializeAuth();
            setupProfileDropdown();
            setupMobileMenu();
            return;
        }
        
        if (attempts < maxAttempts) {
            setTimeout(tryInitialize, retryInterval);
        } else {
            console.warn('❌ Header.js: Max initialization attempts reached');
            // Force initialization anyway
            initializeAuth();
            setupProfileDropdown();
            setupMobileMenu();
        }
    }
    
    tryInitialize();
}

// Helper function to generate avatar SVG
function generateAvatarSVG(initials, size = 40) {
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${size/2}" fill="#4F46E5"/><text x="${size/2}" y="${size/2 + 6}" text-anchor="middle" fill="white" font-family="Arial" font-size="${size * 0.45}" font-weight="bold">${initials}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Load header component
async function loadHeader() {
    try {
        const response = await fetch('/components/header.html');
        const headerHTML = await response.text();
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            headerContainer.innerHTML = headerHTML;
            // Re-initialize after loading
            setTimeout(() => {
                initializeAuth();
                setupProfileDropdown();
                setupMobileMenu();
            }, 100);
        }
    } catch (error) {
        console.error('Error loading header:', error);
    }
}

// Simple and direct authentication initialization
function initializeAuth() {
    console.log('🔄 Initializing authentication state...');
    
    // Wait for DOM to be ready
    setTimeout(() => {
        checkAndDisplayAuthState();
    }, 100);
}

// Check authentication state and display appropriate UI
function checkAndDisplayAuthState() {
    const userInfo = localStorage.getItem('userInfo');
    const token = localStorage.getItem('token');
    const authButtons = document.getElementById('auth-buttons');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    console.log('🔍 Checking auth state:', { hasUserInfo: !!userInfo, hasToken: !!token });
    
    if (!authButtons && !profileDropdown) {
        console.warn('⚠️ No auth elements found, retrying...');
        setTimeout(checkAndDisplayAuthState, 500);
        return;
    }
    
    // Check if user has any authentication data
    if (userInfo || token) {
        try {
            let userData = null;
            
            if (userInfo) {
                userData = JSON.parse(userInfo);
                console.log('📋 UserInfo structure:', { hasToken: !!userData.token, hasUser: !!userData.user, hasName: !!userData.name });
            }
            
            // Validate authentication data
            const isValidAuth = validateAuthenticationData(userData, token);
            
            if (isValidAuth.valid) {
                console.log('✅ Valid authentication found');
                displayUserProfile(isValidAuth.user, authButtons, profileDropdown);
            } else {
                console.log('❌ Invalid authentication, clearing data');
                clearAuthenticationData();
                displayLoginButtons(authButtons, profileDropdown);
            }
        } catch (error) {
            console.error('❌ Error parsing authentication data:', error);
            clearAuthenticationData();
            displayLoginButtons(authButtons, profileDropdown);
        }
    } else {
        console.log('📝 No authentication data found, showing login buttons');
        displayLoginButtons(authButtons, profileDropdown);
    }
}

// Validate authentication data
function validateAuthenticationData(userData, token) {
    // Check if we have a token either in userData or separately
    const hasToken = (userData && userData.token) || token;
    
    if (!hasToken) {
        return { valid: false, user: null };
    }
    
    // Determine user object structure
    let user = null;
    
    if (userData) {
        // Check for nested user structure (userData.user)
        if (userData.user && userData.user.name) {
            user = userData.user;
        }
        // Check for direct user structure (userData has name/email directly)
        else if (userData.name && userData.email) {
            user = userData;
        }
    }
    
    // If we still don't have user data, create minimal user object
    if (!user) {
        user = {
            name: 'User',
            email: 'user@example.com',
            role: 'user'
        };
    }
    
    return { valid: true, user: user };
}

// Clear all authentication data
function clearAuthenticationData() {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('🧹 Authentication data cleared');
}

// Display user profile in header
function displayUserProfile(user, authButtons, profileDropdown) {
    
    // Hide auth buttons
    if (authButtons) {
        authButtons.style.display = 'none';
    }
    
    // Show and update profile dropdown
    if (profileDropdown) {
        profileDropdown.style.display = 'flex';
        profileDropdown.classList.remove('hidden');
        
        // Update profile info
        updateProfileElements(user);
        
    }
}

// Display login buttons
function displayLoginButtons(authButtons, profileDropdown) {
    
    // Show auth buttons
    if (authButtons) {
        authButtons.style.display = 'flex';
        authButtons.classList.remove('hidden');
    }
    
    // Hide profile dropdown
    if (profileDropdown) {
        profileDropdown.style.display = 'none';
        profileDropdown.classList.add('hidden');
    }
    
    console.log('✅ Login buttons displayed');
}

// Update profile elements with user data
function updateProfileElements(user) {
    const elements = {
        'header-user-name': user.name || 'User',
        'header-user-email': user.email || 'user@example.com',
        'dropdown-user-name': user.name || 'User',
        'dropdown-user-email': user.email || 'user@example.com'
    };
    
    // Update text elements
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    // Update avatars
    const initials = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    const avatarSrc = user.profileImage || generateAvatarSVG(initials, 32);
    
    ['header-user-avatar', 'dropdown-user-avatar'].forEach(id => {
        const avatar = document.getElementById(id);
        if (avatar) {
            avatar.src = avatarSrc;
            avatar.onerror = () => {
                avatar.src = generateAvatarSVG(initials, id.includes('dropdown') ? 40 : 32);
            };
        }
    });
    
    // Remove any admin navigation links
    removeAdminNavigation();
}

// Remove any existing admin navigation links
function removeAdminNavigation() {
    // Remove admin links from main navigation
    const adminNavLink = document.getElementById('admin-nav-link');
    if (adminNavLink) adminNavLink.remove();
    
    // Remove admin links from dropdown menu
    const adminDropdownLink = document.getElementById('admin-dropdown-link');
    if (adminDropdownLink) adminDropdownLink.remove();
}

// Legacy function for backward compatibility
function showUserProfile(user, authLinks, profileDropdown) {
    displayUserProfile(user, authLinks, profileDropdown);
}

// Legacy function for backward compatibility
function showLoginButtons(authLinks, profileDropdown) {
    displayLoginButtons(authLinks, profileDropdown);
}

// Load user profile data for header from localStorage and MongoDB
async function loadUserProfileData() {
    try {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            console.log('No userInfo found, redirecting to login');
            return;
        }

        const userData = JSON.parse(userInfo);
        const token = userData.token;
        const user = userData.user;
        
        if (!token || !user) {
            console.log('Invalid userInfo structure, clearing data');
            localStorage.removeItem('userInfo');
            initializeAuth(); // Re-initialize to show login buttons
            return;
        }

        // First update header with stored user data immediately
        updateHeaderProfile(user);

        // Then try to fetch fresh data from API
        console.log('Loading fresh user profile data from MongoDB...');
        try {
            const response = await fetch('/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const apiUserData = await response.json();
                console.log('✅ Fresh profile data loaded from MongoDB:', apiUserData.name);
                
                // Update userInfo with fresh data from API
                const updatedUserInfo = {
                    ...userData,
                    user: apiUserData
                };
                localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
                
                // Update header with fresh MongoDB data
                updateHeaderProfile(apiUserData);
                
            } else if (response.status === 401) {
                // Token expired - clear data and redirect to login
                console.log('Token expired, clearing user data');
                localStorage.removeItem('userInfo');
                showSmartNotification('Phiên đăng nhập đã hết hạn', 'warning', 'top-right');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                console.error('Failed to load profile from API:', response.status);
                // Continue using stored user data
            }
        } catch (apiError) {
            console.error('API request failed:', apiError);
            // Continue using stored user data
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
        localStorage.removeItem('userInfo');
        initializeAuth(); // Re-initialize to show login buttons
    }
}

// Load demo user data
function loadDemoUserData() {
    // Try to get user data from localStorage first
    const storedUser = localStorage.getItem('user');
    let demoUser;
    
    if (storedUser) {
        const userData = JSON.parse(storedUser);
        demoUser = {
            name: userData.name || 'Nguyễn Văn Test',
            email: userData.email || 'test@solaranalytics.com',
            position: userData.position || 'Senior Solar Analytics Engineer',
            profileImage: userData.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            stats: {
                projects: userData.stats?.projectsCompleted || 15,
                reports: userData.stats?.reportsGenerated || 42,
                achievements: userData.stats?.achievementsEarned || 8
            }
        };
    } else {
        demoUser = {
            name: 'Nguyễn Văn Test',
            email: 'test@solaranalytics.com',
            position: 'Senior Solar Analytics Engineer',
            profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            stats: {
                projects: 15,
                reports: 42,
                achievements: 8
            }
        };
    }
    
    updateHeaderProfile(demoUser);
}

// Update header profile information
function updateHeaderProfile(userData) {
    // Update header avatar and name
    const headerAvatar = document.getElementById('header-user-avatar');
    const headerName = document.getElementById('header-user-name');
    const headerRole = document.getElementById('header-user-role');
    
    // Update profile button elements
    const headerUserAvatar = document.getElementById('header-user-avatar');
    const headerUserName = document.getElementById('header-user-name');
    const headerUserRole = document.getElementById('header-user-role');
    
    if (headerUserAvatar) {
        const initials = userData.name ? userData.name.charAt(0).toUpperCase() : 'U';
        headerUserAvatar.src = userData.profileImage || generateAvatarSVG(initials, 32);
        headerUserAvatar.onerror = function() {
            this.src = generateAvatarSVG(initials, 32);
        };
    }
    
    if (headerUserName) {
        headerUserName.textContent = userData.name || 'User';
        // Add click handler to navigate to profile
        headerUserName.onclick = function(e) {
            e.preventDefault();
            window.location.href = '/profile.html';
        };
    }
    
    if (headerUserRole) {
        headerUserRole.textContent = userData.position || userData.role || 'Solar Analytics Engineer';
    }
    
    // Update dropdown profile information with comprehensive data
    const dropdownAvatar = document.getElementById('dropdown-user-avatar');
    const dropdownName = document.getElementById('dropdown-user-name');
    const dropdownEmail = document.getElementById('dropdown-user-email');
    const dropdownRole = document.getElementById('dropdown-user-role');
    
    if (dropdownAvatar) {
        const initials = userData.name ? userData.name.charAt(0).toUpperCase() : 'U';
        dropdownAvatar.src = userData.profileImage || generateAvatarSVG(initials, 40);
        dropdownAvatar.onerror = function() {
            this.src = generateAvatarSVG(initials, 40);
        };
    }
    
    if (dropdownName) {
        dropdownName.textContent = userData.name || 'User';
    }
    
    if (dropdownEmail) {
        dropdownEmail.textContent = userData.email || 'user@example.com';
    }
    
    if (dropdownRole) {
        dropdownRole.textContent = userData.position || userData.role || 'Solar Analytics Engineer';
    }
    
    // Update stats in dropdown with MongoDB data
    const stats = userData.stats || {};
    const dropdownProjects = document.getElementById('dropdown-projects');
    const dropdownReports = document.getElementById('dropdown-reports');
    const dropdownAchievements = document.getElementById('dropdown-achievements');
    
    if (dropdownProjects) {
        dropdownProjects.textContent = stats.projectsCompleted || stats.projects || 0;
    }
    
    if (dropdownReports) {
        dropdownReports.textContent = stats.reportsGenerated || stats.reports || 0;
    }
    
    if (dropdownAchievements) {
        dropdownAchievements.textContent = stats.achievementsEarned || stats.achievements || 0;
    }
    
    // Update additional profile information if available
    if (userData.company) {
        const companyElement = document.getElementById('dropdown-company');
        if (companyElement) {
            companyElement.textContent = userData.company;
        }
    }
    
    // Update member since information
    if (userData.memberSince) {
        const memberSinceElement = document.getElementById('dropdown-member-since');
        if (memberSinceElement) {
            const memberDate = new Date(userData.memberSince);
            memberSinceElement.textContent = `Thành viên từ ${memberDate.toLocaleDateString('vi-VN')}`;
        }
    }
    
    // Update last login information
    if (userData.lastLogin) {
        const lastLoginElement = document.getElementById('dropdown-last-login');
        if (lastLoginElement) {
            const lastLogin = new Date(userData.lastLogin);
            const timeAgo = getTimeAgo(lastLogin);
            lastLoginElement.textContent = `Đăng nhập: ${timeAgo}`;
        }
    }
    
    console.log('✅ Header profile updated successfully');
}

// Helper function to get time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
}

// Setup profile dropdown functionality
function setupProfileDropdown() {
    const dropdownBtn = document.getElementById('profile-dropdown-btn');
    const dropdownMenu = document.getElementById('profile-dropdown-menu');
    
    if (!dropdownBtn || !dropdownMenu) return;
    
    let isDropdownOpen = false;
    
    // Toggle dropdown on button click
    dropdownBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleDropdown();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            closeDropdown();
        }
    });
    
    // Close dropdown on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isDropdownOpen) {
            closeDropdown();
        }
    });
    
    function toggleDropdown() {
        if (isDropdownOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }
    
    function openDropdown() {
        isDropdownOpen = true;
        dropdownMenu.classList.remove('opacity-0', 'invisible', 'scale-95');
        dropdownMenu.classList.add('opacity-100', 'visible', 'scale-100');
        
        // Rotate chevron
        const chevron = dropdownBtn.querySelector('.fa-chevron-down');
        if (chevron) {
            chevron.style.transform = 'rotate(180deg)';
        }
        
        // Add animation to menu items
        const menuItems = dropdownMenu.querySelectorAll('a, button');
        menuItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(10px)';
            setTimeout(() => {
                item.style.transition = 'all 0.2s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }
    
    function closeDropdown() {
        isDropdownOpen = false;
        dropdownMenu.classList.add('opacity-0', 'invisible', 'scale-95');
        dropdownMenu.classList.remove('opacity-100', 'visible', 'scale-100');
        
        // Reset chevron
        const chevron = dropdownBtn.querySelector('.fa-chevron-down');
        if (chevron) {
            chevron.style.transform = 'rotate(0deg)';
        }
        
        // Reset menu items
        const menuItems = dropdownMenu.querySelectorAll('a, button');
        menuItems.forEach(item => {
            item.style.transition = '';
            item.style.opacity = '';
            item.style.transform = '';
        });
    }
}

// Setup mobile menu
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (!mobileMenuBtn || !mobileMenu) return;
    
    mobileMenuBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Mobile menu button clicked');
        
        mobileMenu.classList.toggle('hidden');
        const icon = mobileMenuBtn.querySelector('i');
        
        if (mobileMenu.classList.contains('hidden')) {
            icon.className = 'fas fa-bars text-gray-600';
            console.log('Mobile menu closed');
        } else {
            icon.className = 'fas fa-times text-gray-600';
            console.log('Mobile menu opened');
        }
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!mobileMenuBtn.contains(event.target) && !mobileMenu.contains(event.target)) {
            mobileMenu.classList.add('hidden');
            const icon = mobileMenuBtn.querySelector('i');
            icon.className = 'fas fa-bars text-gray-600';
        }
    });
}

// Settings functionality
function openSettings() {
    // Check authentication state properly
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    
    // Check if user is authenticated
    if (!token && !userInfo) {
        showSmartNotification('Vui lòng đăng nhập để truy cập cài đặt', 'warning', 'top-right');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1000);
        return;
    }
    
    // Additional validation for userInfo structure
    if (userInfo) {
        try {
            const userData = JSON.parse(userInfo);
            if (!userData.token && !token) {
                showSmartNotification('Vui lòng đăng nhập để truy cập cài đặt', 'warning', 'top-right');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1000);
                return;
            }
        } catch (error) {
            console.error('Error parsing userInfo:', error);
            localStorage.removeItem('userInfo');
            showSmartNotification('Vui lòng đăng nhập để truy cập cài đặt', 'warning', 'top-right');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1000);
            return;
        }
    }
    
    // User is authenticated, navigate to settings
    showSmartNotification('Đang chuyển đến trang cài đặt...', 'info', 'top-right');
    setTimeout(() => {
        window.location.href = '/settings.html';
    }, 500);
}

// Logout functionality
function logout() {
    console.log('🚪 Logout initiated');
    
    try {
        // Clear all stored data
        localStorage.removeItem('userInfo');
        localStorage.removeItem('user');
        localStorage.removeItem('token'); // Legacy cleanup
        localStorage.clear(); // Clear all localStorage to be safe
        
        console.log('✅ LocalStorage cleared');
        
        // Update header UI immediately to show login buttons
        const authLinks = document.getElementById('auth-buttons');
        const profileDropdown = document.getElementById('profile-dropdown');
        
        if (authLinks && profileDropdown) {
            showLoginButtons(authLinks, profileDropdown);
            console.log('✅ Header UI updated to show login buttons');
        }
        
        // Show logout notification
        if (typeof showSmartNotification === 'function') {
            showSmartNotification('Đã đăng xuất thành công', 'success', 'top-right');
        }
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            console.log('🔄 Redirecting to login page');
            window.location.href = '/login.html';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error during logout:', error);
        // Force redirect even if there's an error
        window.location.href = '/login.html';
    }
}

// Show notification function
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

// Smart notification system with different positions
function showSmartNotification(message, type = 'info', position = 'top-right') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 
                   type === 'error' ? 'bg-red-500' : 
                   type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
    
    const icon = type === 'success' ? 'fa-check' : 
                type === 'error' ? 'fa-times' : 
                type === 'warning' ? 'fa-exclamation' : 'fa-info';
    
    const positionClasses = {
        'top-right': 'top-4 right-4 translate-x-full',
        'top-left': 'top-4 left-4 -translate-x-full',
        'bottom-right': 'bottom-4 right-4 translate-x-full',
        'bottom-left': 'bottom-4 left-4 -translate-x-full'
    };
    
    notification.className = `fixed z-50 p-4 rounded-lg text-white transform transition-transform duration-300 ${bgColor} ${positionClasses[position]}`;
    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <i class="fas ${icon} mr-2"></i>
            ${message}
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                <i class="fas fa-times text-sm"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (position.includes('right')) {
            notification.classList.remove('translate-x-full');
        } else {
            notification.classList.remove('-translate-x-full');
        }
    }, 100);
    
    setTimeout(() => {
        if (position.includes('right')) {
            notification.classList.add('translate-x-full');
        } else {
            notification.classList.add('-translate-x-full');
        }
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// Navigate to user profile page
function navigateToProfile(event) {
    // Prevent event bubbling to avoid triggering dropdown toggle
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Check authentication state properly
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    
    // Check if user is authenticated
    if (!token && !userInfo) {
        showSmartNotification('Vui lòng đăng nhập để xem profile', 'warning', 'top-right');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1000);
        return;
    }
    
    // Additional validation for userInfo structure
    if (userInfo) {
        try {
            const userData = JSON.parse(userInfo);
            if (!userData.token && !token) {
                showSmartNotification('Vui lòng đăng nhập để xem profile', 'warning', 'top-right');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1000);
                return;
            }
        } catch (error) {
            console.error('Error parsing userInfo:', error);
            localStorage.removeItem('userInfo');
            showSmartNotification('Vui lòng đăng nhập để xem profile', 'warning', 'top-right');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1000);
            return;
        }
    }
    
    // User is authenticated, navigate to profile
    console.log('Navigating to user profile...');
    showSmartNotification('Đang chuyển đến trang profile...', 'info', 'top-right');
    
    setTimeout(() => {
        window.location.href = '/profile.html';
    }, 500);
}

// Update profile from external sources (like profile page)
window.updateHeaderProfile = updateHeaderProfile;

// Export functions for global access
window.headerFunctions = {
    updateHeaderProfile,
    showNotification,
    showSmartNotification,
    logout,
    openSettings
};

// Listen for profile updates
window.addEventListener('profileUpdated', function(event) {
    if (event.detail && event.detail.userData) {
        updateHeaderProfile(event.detail.userData);
    }
});

// Profile dropdown toggle functionality
function toggleProfileDropdown(event) {
    console.log('🔽 Profile dropdown toggle clicked');
    
    // Prevent event bubbling to avoid conflicts
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const dropdownMenu = document.getElementById('profile-dropdown-menu');
    if (dropdownMenu) {
        const isHidden = dropdownMenu.classList.contains('hidden');
        dropdownMenu.classList.toggle('hidden');
        
        console.log(`✅ Dropdown ${isHidden ? 'opened' : 'closed'}`);
        
        // Add visual feedback to chevron icon
        const chevronIcon = document.querySelector('#profile-dropdown .fa-chevron-down');
        if (chevronIcon) {
            if (isHidden) {
                chevronIcon.style.transform = 'rotate(180deg)';
            } else {
                chevronIcon.style.transform = 'rotate(0deg)';
            }
        }
    } else {
        console.warn('❌ Profile dropdown menu not found');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const profileDropdown = document.getElementById('profile-dropdown');
    const dropdownMenu = document.getElementById('profile-dropdown-menu');
    
    if (profileDropdown && dropdownMenu && !profileDropdown.contains(event.target)) {
        dropdownMenu.classList.add('hidden');
        
        // Reset chevron icon rotation
        const chevronIcon = document.querySelector('#profile-dropdown .fa-chevron-down');
        if (chevronIcon) {
            chevronIcon.style.transform = 'rotate(0deg)';
        }
    }
});

// Force authentication check for pages that require login
function forceAuthCheck() {
    console.log('🔒 Force authentication check initiated');
    
    const userInfo = localStorage.getItem('userInfo');
    const token = localStorage.getItem('token');
    
    if (!userInfo && !token) {
        console.log('❌ No authentication found, redirecting to login');
        showSmartNotification('Vui lòng đăng nhập để truy cập trang này', 'warning', 'top-right');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
        return false;
    }
    
    try {
        if (userInfo) {
            const userData = JSON.parse(userInfo);
            const isValidAuth = validateAuthenticationData(userData, token);
            
            if (!isValidAuth.valid) {
                console.log('❌ Invalid authentication, redirecting to login');
                clearAuthenticationData();
                showSmartNotification('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại', 'warning', 'top-right');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
                return false;
            }
        }
    } catch (error) {
        console.error('❌ Error validating authentication:', error);
        clearAuthenticationData();
        showSmartNotification('Lỗi xác thực, vui lòng đăng nhập lại', 'error', 'top-right');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
        return false;
    }
    
    console.log('✅ Authentication check passed');
    return true;
}



// Make functions globally available
window.toggleProfileDropdown = toggleProfileDropdown;
window.initializeAuth = initializeAuth;
window.setupProfileDropdown = setupProfileDropdown;
window.setupMobileMenu = setupMobileMenu;
window.forceAuthCheck = forceAuthCheck;
window.initializeHeaderWithRetry = initializeHeaderWithRetry;

// Auto-refresh user data periodically
setInterval(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        loadUserProfileData();
    }
}, 300000); // Refresh every 5 minutes

// Simple force authentication check
function forceAuthCheck() {
    console.log('🔍 Force authentication check triggered');
    
    // Direct check without complex retry logic
    setTimeout(() => {
        checkAndDisplayAuthState();
    }, 200);
    
    // Additional check after a longer delay
    setTimeout(() => {
        checkAndDisplayAuthState();
    }, 1000);
}

// Export force auth check for use in other pages
window.forceAuthCheck = forceAuthCheck;

// Trigger force auth check on page visibility change (when user switches back to tab)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        setTimeout(() => {
            const userInfo = localStorage.getItem('userInfo');
            const authButtons = document.getElementById('auth-buttons');
            const profileDropdown = document.getElementById('profile-dropdown');
            
            // Only force check if we have user info but showing login buttons
            if (userInfo && authButtons && authButtons.style.display !== 'none') {
                console.log('👁️ Page visible: Force checking auth state');
                forceAuthCheck();
            }
        }, 500);
    }
});

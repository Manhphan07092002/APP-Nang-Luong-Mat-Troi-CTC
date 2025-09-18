// Settings page header functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Settings page loaded, initializing header...');
    
    // Wait for header component to load
    setTimeout(() => {
        initializeSettingsHeader();
    }, 500);
});

function initializeSettingsHeader() {
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    const user = localStorage.getItem('user');
    
    console.log('Initializing settings header with auth data:', {
        hasToken: !!token,
        hasUserInfo: !!userInfo,
        hasUser: !!user
    });
    
    // Check if user is authenticated
    if (!token && !userInfo && !user) {
        console.log('No authentication found, redirecting to login...');
        alert('Vui lòng đăng nhập để truy cập trang cài đặt');
        window.location.href = '/login.html';
        return;
    }
    
    // Get user data from different sources
    let userData = null;
    
    // Priority 1: userInfo from login
    if (userInfo) {
        try {
            const parsed = JSON.parse(userInfo);
            userData = parsed.user || parsed; // Handle nested structure
            console.log('User data from userInfo:', userData);
        } catch (e) {
            console.error('Error parsing userInfo:', e);
        }
    }
    
    // Priority 2: user from localStorage
    if (!userData && user) {
        try {
            userData = JSON.parse(user);
            console.log('User data from user:', userData);
        } catch (e) {
            console.error('Error parsing user:', e);
        }
    }
    
    // Update header UI
    if (userData) {
        updateSettingsHeaderProfile(userData);
        showProfileDropdown();
    } else {
        console.warn('No user data found, using fallback');
        // Try to fetch from API if we have token
        if (token) {
            fetchUserProfileForHeader(token);
        } else {
            showAuthButtons();
        }
    }
}

function updateSettingsHeaderProfile(userData) {
    console.log('Updating header profile with data:', userData);
    
    // Update header avatar and name
    const headerAvatar = document.getElementById('header-user-avatar');
    const headerName = document.getElementById('header-user-name');
    
    // Update dropdown info
    const dropdownAvatar = document.getElementById('dropdown-user-avatar');
    const dropdownName = document.getElementById('dropdown-user-name');
    const dropdownEmail = document.getElementById('dropdown-user-email');
    
    const name = userData.name || 'Người dùng';
    const email = userData.email || 'user@example.com';
    const initials = name.charAt(0).toUpperCase();
    
    // Create avatar SVG
    const createAvatar = (size = 40) => {
        const svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${size}" height="${size}" rx="${size/2}" fill="#4F46E5"/>
            <text x="${size/2}" y="${size/2 + 6}" text-anchor="middle" fill="white" font-family="Arial" font-size="${size/2.2}" font-weight="bold">${initials}</text>
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(svgContent)}`;
    };
    
    const avatarUrl = userData.profileImage || userData.avatar || createAvatar();
    
    // Update header elements
    if (headerAvatar) {
        headerAvatar.src = avatarUrl;
        headerAvatar.onerror = () => headerAvatar.src = createAvatar(32);
        console.log('Updated header avatar');
    }
    
    if (headerName) {
        headerName.textContent = name;
        console.log('Updated header name:', name);
    }
    
    // Update dropdown elements
    if (dropdownAvatar) {
        dropdownAvatar.src = avatarUrl;
        dropdownAvatar.onerror = () => dropdownAvatar.src = createAvatar(40);
        console.log('Updated dropdown avatar');
    }
    
    if (dropdownName) {
        dropdownName.textContent = name;
        console.log('Updated dropdown name:', name);
    }
    
    if (dropdownEmail) {
        dropdownEmail.textContent = email;
        console.log('Updated dropdown email:', email);
    }
}

function showProfileDropdown() {
    const profileDropdown = document.getElementById('profile-dropdown');
    const authButtons = document.getElementById('auth-buttons');
    
    if (profileDropdown) {
        profileDropdown.classList.remove('hidden');
        console.log('Showing profile dropdown');
    }
    
    if (authButtons) {
        authButtons.classList.add('hidden');
        console.log('Hiding auth buttons');
    }
}

function showAuthButtons() {
    const profileDropdown = document.getElementById('profile-dropdown');
    const authButtons = document.getElementById('auth-buttons');
    
    if (profileDropdown) {
        profileDropdown.classList.add('hidden');
    }
    
    if (authButtons) {
        authButtons.classList.remove('hidden');
    }
}

async function fetchUserProfileForHeader(token) {
    try {
        console.log('Fetching user profile from API...');
        const response = await fetch('/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            console.log('Fetched user data from API:', userData);
            updateSettingsHeaderProfile(userData);
            showProfileDropdown();
            
            // Store for future use
            localStorage.setItem('userInfo', JSON.stringify(userData));
        } else {
            console.error('Failed to fetch profile:', response.status);
            if (response.status === 401) {
                // Invalid token
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            } else {
                showAuthButtons();
            }
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        showAuthButtons();
    }
}

// Global functions for header interactions
window.toggleProfileDropdown = function(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById('profile-dropdown-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
};

window.logout = function() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userInfo');
        window.location.href = '/login.html';
    }
};

window.openSettings = function() {
    // Already on settings page
    console.log('Already on settings page');
};

window.navigateToProfile = function(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    window.location.href = '/profile.html';
};

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('profile-dropdown');
    const menu = document.getElementById('profile-dropdown-menu');
    
    if (dropdown && menu && !dropdown.contains(event.target)) {
        menu.classList.add('hidden');
    }
});

// NUCLEAR Authentication Fix - FORCE authentication display
(function() {
    'use strict';
    
    // Authentication system activated
    
    // Authentication fix
    function nuclearAuthFix() {
        // Check if user is logged in
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            forceShowLoginButtons();
            return;
        }

        let userData;
        try {
            userData = JSON.parse(userInfo);
            
            // Check for different user data formats
            const isNestedUser = userData.token && userData.user && userData.user.name;
            const isDirectUser = userData.token && userData.name && userData.email;
            
            if (!isNestedUser && !isDirectUser) {
                forceShowLoginButtons();
                return;
            }
            
            // Normalize to nested format for consistency
            if (isDirectUser && !isNestedUser) {
                userData.user = {
                    name: userData.name,
                    email: userData.email,
                    role: userData.role || 'user',
                    profileImage: userData.profileImage
                };
            }
        } catch (error) {
            localStorage.removeItem('userInfo');
            forceShowLoginButtons();
            return;
        }
        
        forceShowProfile(userData.user);
    }
    
    // Show profile
    function forceShowProfile(user) {
        let authButtons = document.getElementById('auth-buttons');
        let profileDropdown = document.getElementById('profile-dropdown');
        
        if (!authButtons || !profileDropdown) {
            createAuthElements();
            authButtons = document.getElementById('auth-buttons');
            profileDropdown = document.getElementById('profile-dropdown');
        }
        
        if (authButtons && profileDropdown) {
            // Hide login buttons
            authButtons.style.cssText = 'display: none !important; visibility: hidden !important;';
            authButtons.classList.add('hidden');
            
            // Show profile
            profileDropdown.style.cssText = 'display: flex !important; visibility: visible !important;';
            profileDropdown.classList.remove('hidden');
            
            // Update profile info
            updateProfile(user);
        }
    }
    
    // Show login buttons
    function forceShowLoginButtons() {
        let authButtons = document.getElementById('auth-buttons');
        let profileDropdown = document.getElementById('profile-dropdown');
        
        if (!authButtons || !profileDropdown) {
            createAuthElements();
            authButtons = document.getElementById('auth-buttons');
            profileDropdown = document.getElementById('profile-dropdown');
        }
        
        if (authButtons && profileDropdown) {
            // Show login buttons
            authButtons.style.cssText = 'display: flex !important; visibility: visible !important;';
            authButtons.classList.remove('hidden');
            
            // Hide profile
            profileDropdown.style.cssText = 'display: none !important; visibility: hidden !important;';
            profileDropdown.classList.add('hidden');
        }
    }
    
    // Create auth elements if missing
    function createAuthElements() {
        const header = document.getElementById('header-container') || document.querySelector('header');
        if (!header) return;
        
        if (!document.getElementById('auth-buttons')) {
            const authDiv = document.createElement('div');
            authDiv.id = 'auth-buttons';
            authDiv.className = 'flex items-center space-x-4';
            authDiv.innerHTML = `
                <a href="/login.html" class="text-blue-600 hover:text-blue-800 font-medium">Đăng nhập</a>
                <a href="/register.html" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Đăng ký</a>
            `;
            header.appendChild(authDiv);
        }
        
        if (!document.getElementById('profile-dropdown')) {
            const profileDiv = document.createElement('div');
            profileDiv.id = 'profile-dropdown';
            profileDiv.className = 'relative flex items-center space-x-3 hidden';
            profileDiv.innerHTML = `
                <img id="header-user-avatar" src="" alt="Avatar" class="w-8 h-8 rounded-full">
                <div class="hidden md:block">
                    <div id="header-user-name" class="text-sm font-medium">User</div>
                    <div id="header-user-email" class="text-xs text-gray-500">user@example.com</div>
                </div>
            `;
            header.appendChild(profileDiv);
        }
    }
    
    // Update profile info
    function updateProfile(user) {
        const nameEl = document.getElementById('header-user-name');
        const emailEl = document.getElementById('header-user-email');
        const avatarEl = document.getElementById('header-user-avatar');
        
        if (nameEl) nameEl.textContent = user.name || 'User';
        if (emailEl) emailEl.textContent = user.email || 'user@example.com';
        if (avatarEl) {
            const initials = user.name ? user.name.charAt(0).toUpperCase() : 'U';
            avatarEl.src = user.profileImage || `data:image/svg+xml;base64,${btoa(`<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="16" fill="#4F46E5"/><text x="16" y="22" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">${initials}</text></svg>`)}`;
        }
    }
    
    // Initialize authentication
    function initNuclearAuth() {
        // Run immediately
        nuclearAuthFix();
        
        // Run periodically
        setInterval(nuclearAuthFix, 2000);
        
        // Run on events
        window.addEventListener('load', nuclearAuthFix);
        document.addEventListener('DOMContentLoaded', nuclearAuthFix);
        window.addEventListener('headerLoaded', nuclearAuthFix);
        document.addEventListener('visibilitychange', nuclearAuthFix);
        
        // Watch for DOM changes
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(() => {
                setTimeout(nuclearAuthFix, 100);
            });
            
            setTimeout(() => {
                const header = document.getElementById('header-container');
                if (header) {
                    observer.observe(header, { childList: true, subtree: true });
                }
            }, 100);
        }
    }
    
    // Export functions
    window.nuclearAuthFix = nuclearAuthFix;
    window.forceShowProfile = forceShowProfile;
    window.forceShowLoginButtons = forceShowLoginButtons;
    window.immediateAuthFix = nuclearAuthFix;
    window.enhancedAuthFix = nuclearAuthFix;
    
    // Launch authentication system
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNuclearAuth);
    } else {
        initNuclearAuth();
    }
})();

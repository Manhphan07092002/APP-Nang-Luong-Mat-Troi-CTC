// File: client/js/main.js
// Main JavaScript for Solar Analytics Application

document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM loaded, initializing main.js');

    /**
     * Tải và chèn nội dung của một component HTML vào một selector được chỉ định.
     * @param {string} selector - CSS selector của phần tử để chèn component vào (VD: "#header-placeholder").
     * @param {string} url - Đường dẫn đến file component HTML (VD: "/components/header.html").
     * @returns {Promise<void>} - Một promise sẽ hoàn thành khi component được tải.
     */
    const loadComponent = (selector, url) => {
        const element = document.querySelector(selector);
        if (element) {
            console.log(`Loading component: ${url} into ${selector}`);
            return fetch(url)
                .then(response => {
                    if (!response.ok) throw new Error(`Không thể tải component: ${url}`);
                    return response.text();
                })
                .then(data => {
                    element.innerHTML = data;
                    console.log(`Component loaded successfully: ${url}`);
                })
                .catch(error => {
                    console.error(`Lỗi khi tải component ${url}:`, error);
                    throw error;
                });
        }
        return Promise.resolve();
    };

    // --- HEADER FUNCTIONALITY ---
    
    // Setup mobile menu after header is loaded
    function setupMobileMenuAfterLoad() {
        console.log('Setting up mobile menu...');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuBtn && mobileMenu) {
            console.log('Mobile menu elements found, setting up event listeners');
            
            // Remove any existing listeners
            mobileMenuBtn.replaceWith(mobileMenuBtn.cloneNode(true));
            const newBtn = document.getElementById('mobile-menu-btn');
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Mobile menu button clicked');
                
                mobileMenu.classList.toggle('hidden');
                const icon = newBtn.querySelector('i');
                
                if (mobileMenu.classList.contains('hidden')) {
                    icon.className = 'fas fa-bars text-gray-600';
                    console.log('Mobile menu closed');
                } else {
                    icon.className = 'fas fa-times text-gray-600';
                    console.log('Mobile menu opened');
                }
            });
        } else {
            console.log('Mobile menu elements not found');
        }
    }

    // Profile dropdown functions
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

    window.navigateToProfile = function(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        window.location.href = '/profile.html';
    };

    window.navigateToSettings = function(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        window.location.href = '/settings.html';
    };

    window.logout = function(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = '/login.html';
    };

    // Load header profile data
    function loadHeaderProfile() {
        try {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const userData = JSON.parse(userInfo);
                if (userData && userData.user) {
                    updateHeaderProfile(userData.user);
                }
            }
        } catch (error) {
            console.error('Error loading header profile:', error);
        }
    }

    // Update header profile display
    function updateHeaderProfile(userData) {
        // Update header button
        const headerAvatar = document.getElementById('header-user-avatar');
        const headerName = document.getElementById('header-user-name');
        const headerEmail = document.getElementById('header-user-email');
        
        // Update dropdown
        const dropdownAvatar = document.getElementById('dropdown-user-avatar');
        const dropdownName = document.getElementById('dropdown-user-name');
        const dropdownEmail = document.getElementById('dropdown-user-email');
        
        const initials = userData.name ? userData.name.charAt(0).toUpperCase() : 'U';
        
        // Create safe SVG avatar with proper XML structure
        const createSafeAvatar = (size = 40) => {
            try {
                const svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                    <rect width="${size}" height="${size}" rx="${size/2}" fill="#4F46E5"/>
                    <text x="${size/2}" y="${size/2 + 6}" text-anchor="middle" fill="white" font-family="Arial" font-size="${size/2.2}" font-weight="bold">${initials}</text>
                </svg>`;
                return `data:image/svg+xml;base64,${btoa(svgContent)}`;
            } catch (error) {
                console.warn('Failed to create SVG avatar, using fallback');
                return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSIyMCIgZmlsbD0iIzRGNDZFNSIvPjx0ZXh0IHg9IjIwIiB5PSIyNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiPlU8L3RleHQ+PC9zdmc+';
            }
        };
        
        const avatarUrl = userData.profileImage || userData.avatar || createSafeAvatar();
        
        if (headerAvatar) {
            headerAvatar.src = avatarUrl;
            headerAvatar.onerror = () => {
                headerAvatar.src = createSafeAvatar(32);
            };
        }
        if (headerName) headerName.textContent = userData.name || 'Người dùng';
        if (headerEmail) headerEmail.textContent = userData.email || 'user@example.com';
        
        if (dropdownAvatar) {
            dropdownAvatar.src = avatarUrl;
            dropdownAvatar.onerror = () => {
                dropdownAvatar.src = createSafeAvatar(40);
            };
        }
        if (dropdownName) dropdownName.textContent = userData.name || 'Người dùng';
        if (dropdownEmail) dropdownEmail.textContent = userData.email || 'user@example.com';
    }

    // Initialize header authentication state
    function initializeHeaderAuth() {
        const token = localStorage.getItem('token');
        const userInfo = localStorage.getItem('userInfo');
        const user = localStorage.getItem('user');
        const profileDropdown = document.getElementById('profile-dropdown');
        const authButtons = document.getElementById('auth-buttons');
        
        // Check if user is authenticated (any of these indicate authentication)
        const isAuthenticated = !!(token || userInfo || user);
        
        if (isAuthenticated) {
            // User is authenticated - hide login buttons, show profile
            if (authButtons) authButtons.classList.add('hidden');
            if (profileDropdown) profileDropdown.classList.remove('hidden');
        } else {
            // User not authenticated - show login buttons, hide profile
            if (profileDropdown) profileDropdown.classList.add('hidden');
            if (authButtons) authButtons.classList.remove('hidden');
        }
    }

    // Load header first, then set up functionality
    const headerContainer = document.getElementById('header-container') || document.getElementById('header-placeholder');
    console.log('Header container found:', !!headerContainer);
    
    if (headerContainer) {
        loadComponent('#header-container, #header-placeholder', '/components/header.html')
            .then(() => {
                console.log('Header loaded, initializing functionality');
                // Wait a bit for DOM to settle
                setTimeout(() => {
                    initializeHeaderAuth();
                    loadHeaderProfile();
                    setupMobileMenuAfterLoad();
                }, 200);
            })
            .catch(error => {
                console.error('Failed to load header:', error);
            });
    } else {
        console.log('No header container found');
    }

    // Load other components as needed
    loadComponent('#footer-placeholder', '/components/footer.html');

});

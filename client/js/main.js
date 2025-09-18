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
        
        // Check if user is logged in - check both token and userInfo
        const token = localStorage.getItem('token');
        const userInfo = localStorage.getItem('userInfo');
        
        if (!token && !userInfo) {
            alert('Vui lòng đăng nhập để xem profile');
            window.location.href = '/login.html';
            return;
        }
        
        // Additional check for userInfo structure
        if (userInfo) {
            try {
                const userData = JSON.parse(userInfo);
                if (!userData.token && !token) {
                    alert('Vui lòng đăng nhập để xem profile');
                    window.location.href = '/login.html';
                    return;
                }
            } catch (error) {
                console.error('Error parsing userInfo:', error);
                alert('Vui lòng đăng nhập để xem profile');
                window.location.href = '/login.html';
                return;
            }
        }
        
        // Navigate to profile page
        window.location.href = '/profile.html';
    };

    window.logout = function() {
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            // Clear all authentication data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userInfo');
            
            // Update header UI immediately
            const profileDropdown = document.getElementById('profile-dropdown');
            const authButtons = document.getElementById('auth-buttons');
            
            if (profileDropdown) profileDropdown.classList.add('hidden');
            if (authButtons) authButtons.classList.remove('hidden');
            
            // Redirect to login page
            window.location.href = '/login.html';
        }
    };

    window.openSettings = function() {
        // Check if user is logged in - check both token and userInfo
        const token = localStorage.getItem('token');
        const userInfo = localStorage.getItem('userInfo');
        
        if (!token && !userInfo) {
            alert('Vui lòng đăng nhập để truy cập cài đặt');
            window.location.href = '/login.html';
            return;
        }
        
        // Additional check for userInfo structure
        if (userInfo) {
            try {
                const userData = JSON.parse(userInfo);
                if (!userData.token && !token) {
                    alert('Vui lòng đăng nhập để truy cập cài đặt');
                    window.location.href = '/login.html';
                    return;
                }
            } catch (error) {
                console.error('Error parsing userInfo:', error);
                alert('Vui lòng đăng nhập để truy cập cài đặt');
                window.location.href = '/login.html';
                return;
            }
        }
        
        // Navigate to settings page
        window.location.href = '/settings.html';
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('profile-dropdown');
        const menu = document.getElementById('profile-dropdown-menu');
        
        if (dropdown && menu && !dropdown.contains(event.target)) {
            menu.classList.add('hidden');
        }
    });

    // Load user profile data for header
    async function loadHeaderProfile() {
        const token = localStorage.getItem('token');
        const userInfo = localStorage.getItem('userInfo');
        const user = localStorage.getItem('user');
        const profileDropdown = document.getElementById('profile-dropdown');
        const authButtons = document.getElementById('auth-buttons');
        
        
        // Try different sources of user data
        let userData = null;
        
        // Priority 1: userInfo from localStorage (from login)
        if (userInfo) {
            try {
                userData = JSON.parse(userInfo);
                // Handle nested user object structure
                userData = userData.user || userData;
            } catch (error) {
                console.error('Error parsing userInfo:', error);
            }
        }
        
        // Priority 2: user from localStorage
        if (!userData && user) {
            try {
                userData = JSON.parse(user);
            } catch (error) {
                console.error('Error parsing user:', error);
            }
        }
        
        // Priority 3: If we have token but no user data, fetch from API
        if (!userData && token) {
            try {
                const response = await fetch('/api/users/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    userData = await response.json();
                } else {
                    console.error('Failed to load profile from API');
                    // Clear invalid token
                    localStorage.removeItem('token');
                }
            } catch (error) {
                console.error('Error loading header profile from API:', error);
                localStorage.removeItem('token');
            }
        }
        
        // Update UI based on authentication state
        if (userData && (token || userInfo || user)) {
            // User is logged in - show profile, hide auth buttons
            updateHeaderProfile(userData);
            if (profileDropdown) profileDropdown.classList.remove('hidden');
            if (authButtons) authButtons.classList.add('hidden');
        } else {
            // User not logged in - show auth buttons, hide profile
            if (profileDropdown) profileDropdown.classList.add('hidden');
            if (authButtons) authButtons.classList.remove('hidden');
        }
    }

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
            
            // Load and display user profile data
            let userData = null;
            
            // Try to parse user data from different storage keys
            if (userInfo) {
                try {
                    userData = JSON.parse(userInfo);
                } catch (e) {
                    console.warn('Failed to parse userInfo:', e);
                }
            }
            
            if (!userData && user) {
                try {
                    userData = JSON.parse(user);
                } catch (e) {
                    console.warn('Failed to parse user:', e);
                }
            }
            
            // If we have user data, update the profile display
            if (userData) {
                updateHeaderProfile(userData);
            } else {
                // Fallback: try to fetch user data from server if we have a token
                if (token) {
                    fetchUserProfile(token);
                }
            }
        } else {
            // User not authenticated - show login buttons, hide profile
            if (profileDropdown) profileDropdown.classList.add('hidden');
            if (authButtons) authButtons.classList.remove('hidden');
        }
    }

    // Function to fetch user profile from server
    async function fetchUserProfile(token) {
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                updateHeaderProfile(userData);
                // Store the fetched data for future use
                localStorage.setItem('userInfo', JSON.stringify(userData));
            } else {
                console.warn('Failed to fetch user profile:', response.status);
                // If token is invalid, clear it and show login buttons
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userInfo');
                    localStorage.removeItem('user');
                    initializeHeaderAuth();
                }
            }
        } catch (error) {
            console.warn('Error fetching user profile:', error);
        }
    }

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

// Function to load header profile data
function loadHeaderProfile() {
    // Check if user is authenticated and load profile
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    const user = localStorage.getItem('user');
    
    if (token || userInfo || user) {
        let userData = null;
        
        // Try to get user data from localStorage first
        if (userInfo) {
            try {
                userData = JSON.parse(userInfo);
            } catch (e) {
                console.warn('Failed to parse userInfo:', e);
            }
        }
        
        if (!userData && user) {
            try {
                userData = JSON.parse(user);
            } catch (e) {
                console.warn('Failed to parse user:', e);
            }
        }
        
        // If we have user data, update the profile
        if (userData) {
            updateHeaderProfile(userData);
        } else if (token) {
            // Try to fetch from server
            fetchUserProfile(token);
        } else {
            // Create a test user profile for demonstration
            const testUser = {
                name: 'Nguyễn Văn A',
                email: 'nguyenvana@example.com',
                role: 'user'
            };
            updateHeaderProfile(testUser);
        }
    }
}

// Number counting animation function
function animateNumber(element, target, duration = 2000, decimals = 0, suffix = '') {
    const start = 0;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easeOutCubic for smooth animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = start + (target - start) * easeProgress;
        
        // Format number with decimals if specified
        let displayValue = decimals > 0 ? current.toFixed(decimals) : Math.floor(current);
        
        // Add comma separator for large numbers
        if (target >= 1000 && decimals === 0) {
            displayValue = Math.floor(current).toLocaleString();
        }
        
        element.textContent = displayValue + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Initialize stats number animations
function initializeStatsAnimations() {
    const statsNumbers = document.querySelectorAll('.stats-number[data-target]');
    console.log('Found stats numbers:', statsNumbers.length);
    
    if (statsNumbers.length === 0) {
        console.warn('No stats numbers found for animation');
        return;
    }
    
    // Create intersection observer to trigger animations when visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                console.log('Animating stats number:', entry.target.dataset.target);
                entry.target.classList.add('animated');
                
                const target = parseFloat(entry.target.dataset.target);
                const suffix = entry.target.dataset.suffix || '';
                const decimals = parseInt(entry.target.dataset.decimal) || 0;
                
                // Add slight delay for staggered effect
                const delay = Array.from(statsNumbers).indexOf(entry.target) * 300;
                
                setTimeout(() => {
                    animateNumber(entry.target, target, 2500, decimals, suffix);
                }, delay);
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    });
    
    statsNumbers.forEach(number => {
        observer.observe(number);
        console.log('Observing:', number.dataset.target);
    });
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

    // --- COMPONENT LOADING ---
    
    // Load header first, then set up functionality
    const headerContainer = document.getElementById('header-container') || document.getElementById('header-placeholder');
    console.log('Header container found:', !!headerContainer);
    
    if (headerContainer) {
        // Load header component first, then initialize auth
        loadComponent('#header-container', '/components/header.html')
            .then(() => {
                console.log('Header component loaded, initializing authentication...');
                setupMobileMenuAfterLoad();
                
                // Wait a bit for DOM elements to be ready
                setTimeout(() => {
                    initializeHeaderAuth();
                    loadHeaderProfile();
                    initializeStatsAnimations();
                }, 100);
            })
            .catch(error => {
                console.error('Failed to load header component:', error);
            });
    } else {
        console.log('No header container found');
    }

    // Load other components as needed
    const footerContainer = document.getElementById('footer-placeholder');
    if (footerContainer) {
        loadComponent('#footer-placeholder', '/components/footer.html');
    }

    // Fallback initialization for stats animations
    setTimeout(() => {
        if (document.querySelectorAll('.stats-number[data-target]').length > 0) {
            initializeStatsAnimations();
            console.log('Stats animations initialized as fallback');
        }
    }, 1000);

});

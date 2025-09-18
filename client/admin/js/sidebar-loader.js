document.addEventListener('DOMContentLoaded', function () {
    const sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'sidebar-container';
    document.body.prepend(sidebarContainer);

    fetch('components/sidebar.html')
        .then(response => response.text())
        .then(data => {
            sidebarContainer.innerHTML = data;
            setActiveLink();
            setupSidebar();
        })
        .catch(error => console.error('Error loading sidebar:', error));

    function setActiveLink() {
        const currentPage = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    }

    function setupSidebar() {
        // Setup logout functionality
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                // Clear all session data for both admin and regular user
                localStorage.removeItem('adminInfo');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('userInfo');
                localStorage.removeItem('token');
                // Redirect to login page
                window.location.href = 'login.html';
            });
        }

        // Load admin info into sidebar
        try {
            const adminInfoString = localStorage.getItem('adminInfo');
            if (!adminInfoString) {
                console.warn('Admin info not found in localStorage. Sidebar may not display user data.');
                return;
            }

            const adminInfo = JSON.parse(adminInfoString);
            const adminNameEl = document.getElementById('sidebar-admin-name');
            const adminRoleEl = document.getElementById('sidebar-admin-role');
            const adminAvatarEl = document.getElementById('sidebar-admin-avatar');

            if (adminInfo && adminNameEl && adminRoleEl && adminAvatarEl) {
                adminNameEl.textContent = adminInfo.name || 'Admin User';
                adminRoleEl.textContent = adminInfo.role === 'admin' ? 'Administrator' : 'User';
                
                if (adminInfo.profileImage) {
                    adminAvatarEl.innerHTML = `<img src="${adminInfo.profileImage}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                } else {
                    adminAvatarEl.textContent = adminInfo.name ? adminInfo.name.charAt(0).toUpperCase() : 'A';
                }
            }
        } catch (error) {
            console.error('Could not load admin info for sidebar:', error);
        }
    }
});

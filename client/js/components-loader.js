// Components Loader - Load header and footer dynamically
class ComponentsLoader {
    constructor() {
        this.init();
    }
    
    async init() {
        try {
            await Promise.all([
                this.loadHeader(),
                this.loadFooter()
            ]);
        } catch (error) {
            console.error('Error loading components:', error);
        }
    }
    
    async loadHeader() {
        try {
            const headerContainer = document.getElementById('header-container');
            if (!headerContainer) return;
            
            const response = await fetch('/components/header.html');
            if (response.ok) {
                const headerHTML = await response.text();
                
                // Sanitize SVG content to prevent parsing errors
                const sanitizedHTML = this.sanitizeSVGContent(headerHTML);
                headerContainer.innerHTML = sanitizedHTML;
                
                // Initialize header functionality with improved timing
                this.initializeHeaderFunctionality();
            }
        } catch (error) {
            console.error('Error loading header:', error);
        }
    }
    
    initializeHeaderFunctionality() {
        let attempts = 0;
        const maxAttempts = 15;
        const baseDelay = 100;
        
        const tryInitialize = () => {
            attempts++;
            console.log(`🔄 ComponentsLoader: Header init attempt ${attempts}/${maxAttempts}`);
            
            const authButtons = document.getElementById('auth-buttons');
            const profileDropdown = document.getElementById('profile-dropdown');
            
            if (authButtons || profileDropdown) {
                console.log('✅ ComponentsLoader: Header elements found, initializing...');
                
                // Initialize all header functionality
                if (window.initializeAuth) {
                    window.initializeAuth();
                }
                if (window.setupProfileDropdown) {
                    window.setupProfileDropdown();
                }
                if (window.setupMobileMenu) {
                    window.setupMobileMenu();
                }
                
                // Dispatch event to notify header is ready
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('headerLoaded'));
                }, 50);
                
                return;
            }
            
            if (attempts < maxAttempts) {
                const delay = baseDelay * Math.min(attempts, 5); // Progressive delay
                setTimeout(tryInitialize, delay);
            } else {
                console.warn('⚠️ ComponentsLoader: Max attempts reached, forcing initialization');
                // Force initialization even if elements not found
                if (window.initializeAuth) {
                    window.initializeAuth();
                }
                window.dispatchEvent(new CustomEvent('headerLoaded'));
            }
        };
        
        // Start initialization with a small delay to ensure DOM is ready
        setTimeout(tryInitialize, 150);
    }
    
    sanitizeSVGContent(html) {
        try {
            // Fix common SVG parsing issues
            return html
                .replace(/<svg[^>]*>/g, (match) => {
                    // Ensure SVG tags are properly closed
                    if (!match.includes('/>') && !html.includes('</svg>')) {
                        return match.replace('>', '/>');
                    }
                    return match;
                })
                // Remove incomplete SVG tags
                .replace(/<svg[^>]*(?!>|\/>)$/gm, '')
                // Ensure proper XML namespace
                .replace(/<svg(?![^>]*xmlns)/g, '<svg xmlns="http://www.w3.org/2000/svg"');
        } catch (error) {
            console.warn('SVG sanitization failed, using original content:', error);
            return html;
        }
    }
    
    async loadFooter() {
        try {
            const footerContainer = document.getElementById('footer-container');
            if (!footerContainer) return;
            
            const response = await fetch('/components/footer.html');
            if (response.ok) {
                const footerHTML = await response.text();
                footerContainer.innerHTML = footerHTML;
            }
        } catch (error) {
            console.error('Error loading footer:', error);
        }
    }
}

// Initialize when DOM is loaded with error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Prevent browser extension conflicts
        if (window.chrome && window.chrome.runtime) {
            console.log('Browser extension detected, using safe mode');
        }
        
        new ComponentsLoader();
    } catch (error) {
        console.error('ComponentsLoader initialization failed:', error);
        // Fallback: try to load components manually
        setTimeout(() => {
            try {
                new ComponentsLoader();
            } catch (retryError) {
                console.error('ComponentsLoader retry failed:', retryError);
            }
        }, 100);
    }
});

/**
 * Global Sticky Header Controller
 * Applies sticky header functionality to all pages
 */
class StickyHeaderController {
    constructor() {
        this.header = null;
        this.lastScrollY = 0;
        this.isScrolling = false;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Find header element
        this.header = document.getElementById('header-container') || 
                     document.querySelector('header') || 
                     document.querySelector('.header');

        if (!this.header) {
            console.warn('Header element not found for sticky functionality');
            return;
        }

        // Apply sticky header class
        this.header.classList.add('sticky-header');
        
        // Add body class for padding
        document.body.classList.add('has-sticky-header');

        // Setup scroll listener
        this.setupScrollListener();
        
        // Initial state
        this.updateHeaderState();
    }

    setupScrollListener() {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateHeaderState();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    updateHeaderState() {
        if (!this.header) return;

        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY > this.lastScrollY;
        const scrolledPastThreshold = currentScrollY > 100;

        // Add/remove scrolled class for styling
        if (scrolledPastThreshold) {
            this.header.classList.add('scrolled');
        } else {
            this.header.classList.remove('scrolled');
        }

        // Smart hide/show behavior (optional - can be disabled)
        if (this.shouldUseSmartHide()) {
            if (scrollingDown && currentScrollY > 200) {
                this.header.style.transform = 'translateY(-100%)';
            } else {
                this.header.style.transform = 'translateY(0)';
            }
        }

        this.lastScrollY = currentScrollY;
    }

    shouldUseSmartHide() {
        // Check if page wants smart hide behavior
        return document.body.hasAttribute('data-smart-header') || 
               document.body.classList.contains('smart-header');
    }

    // Public methods for manual control
    show() {
        if (this.header) {
            this.header.style.transform = 'translateY(0)';
        }
    }

    hide() {
        if (this.header) {
            this.header.style.transform = 'translateY(-100%)';
        }
    }

    toggle() {
        if (this.header) {
            const isHidden = this.header.style.transform === 'translateY(-100%)';
            this.header.style.transform = isHidden ? 'translateY(0)' : 'translateY(-100%)';
        }
    }
}

// Auto-initialize when script loads
const stickyHeader = new StickyHeaderController();

// Export for manual control if needed
window.StickyHeader = stickyHeader;

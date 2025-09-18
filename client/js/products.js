// Products page functionality
class ProductsManager {
    constructor() {
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.currentFilters = {
            category: '',
            minPrice: '',
            maxPrice: '',
            search: '',
            sort: '-createdAt',
            featured: false,
            inStock: false
        };
        this.categories = [];
        this.products = [];
        this.totalProducts = 0;
        this.totalPages = 0;
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadCategories();
            this.loadProducts().then(() => {
                this.setupPriceSlider();
            });
            this.setupEventListeners();
            this.setupSearch();
            this.setupFilterToggles();
        } catch (error) {
            console.error('Error initializing products page:', error);
            this.showError('Có lỗi xảy ra khi tải trang sản phẩm');
        }
    }
    
    async loadCategories() {
        try {
            const response = await fetch('/api/products/categories');
            const data = await response.json();
            
            if (data.success) {
                this.categories = data.data;
                this.renderCategoryFilters();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }
    
    renderCategoryFilters() {
        const container = document.getElementById('category-filters');
        if (!container) return;
        
        // Clear existing categories, but keep the 'All' button
        const allButton = container.querySelector('[data-category=""]');
        container.innerHTML = ''; // Clear all buttons
        if (allButton) {
            container.appendChild(allButton); // Add 'All' button back
        }

        this.categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-button category-filter';
            button.setAttribute('data-category', category.value);
            button.innerHTML = `
                ${category.icon ? `<span class="text-lg">${category.icon}</span>` : ''}
                <span>${category.label}</span>
                <span class="category-count">${category.count}</span>
            `;
            container.appendChild(button);
        });
    }
    
    async loadProducts() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.productsPerPage,
                sort: this.currentFilters.sort
            });
            
            // Add filters
            if (this.currentFilters.category) params.append('category', this.currentFilters.category);
            if (this.currentFilters.minPrice) params.append('minPrice', this.currentFilters.minPrice);
            if (this.currentFilters.maxPrice) params.append('maxPrice', this.currentFilters.maxPrice);
            if (this.currentFilters.search) params.append('search', this.currentFilters.search);
            if (this.currentFilters.featured) params.append('featured', 'true');
            if (this.currentFilters.inStock) params.append('inStock', 'true');
            
            const response = await fetch(`/api/products?${params}`);
            const data = await response.json();
            
            if (data.success) {
                this.products = data.data.products;
                this.totalProducts = data.data.pagination.totalProducts;
                this.totalPages = data.data.pagination.totalPages;
                
                this.renderProducts();
                this.renderPagination(data.data.pagination);
                this.updateProductsCount();
            } else {
                throw new Error(data.message || 'Không thể tải sản phẩm');
            }
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Có lỗi xảy ra khi tải sản phẩm');
        } finally {
            this.hideLoading();
        }
    }
    
    renderProducts() {
        const grid = document.getElementById('products-grid');
        const noProductsState = document.getElementById('no-products-state');
        
        if (!grid) return;
        
        if (this.products.length === 0) {
            grid.classList.add('hidden');
            noProductsState.classList.remove('hidden');
            return;
        }
        
        grid.classList.remove('hidden');
        noProductsState.classList.add('hidden');
        
        grid.innerHTML = this.products.map(product => this.createProductCard(product)).join('');
    }
    
    createProductCard(product) {
        const primaryImage = product.primaryImage || (product.images && product.images[0]);
        const hasImage = primaryImage && primaryImage.url;
        const imageUrl = hasImage ? primaryImage.url : '';
        const imageAlt = hasImage ? (primaryImage.alt || product.name) : 'No Image';
        
        const discountBadge = product.discountPercentage > 0 ? 
            `<div class="discount-badge">-${product.discountPercentage}%</div>` : '';
        
        const originalPrice = product.originalPrice && product.originalPrice > product.price ?
            `<span class="text-sm text-gray-500 line-through ml-2">${this.formatPrice(product.originalPrice)}</span>` : '';
        
        const stockStatus = product.inStock ? 
            '<div class="stock-badge"><i class="fas fa-check-circle mr-1"></i>Còn hàng</div>' :
            '<div class="stock-badge out-of-stock"><i class="fas fa-times-circle mr-1"></i>Hết hàng</div>';
        
        const rating = product.rating && product.rating.count > 0 ?
            `<div class="flex items-center text-sm mb-3">
                <div class="flex rating-stars mr-2">
                    ${this.renderStars(product.rating.average)}
                </div>
                <span class="text-gray-600 font-medium">${product.rating.average.toFixed(1)}</span>
                <span class="text-gray-500 ml-1">(${product.rating.count})</span>
            </div>` : '<div class="mb-3"></div>';
        
        return `
            <div class="product-card group cursor-pointer" onclick="productsManager.viewProduct('${product._id}')">
                <div class="product-image relative">
                    ${hasImage ? 
                        `<img src="${imageUrl}" alt="${imageAlt}" 
                             class="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
                             onerror="this.parentElement.innerHTML='<div class=\\'no-image-placeholder\\'>No Image</div>'">` :
                        `<div class="no-image-placeholder">No Image</div>`
                    }
                    ${discountBadge}
                    ${product.isFeatured ? '<div class="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">⭐ Nổi bật</div>' : ''}
                    <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div class="p-6 space-y-4">
                    <!-- Category Badge -->
                    <div class="flex items-center justify-between">
                        <span class="category-pill text-xs font-medium">${this.getCategoryLabel(product.category)}</span>
                        ${stockStatus}
                    </div>
                    
                    <!-- Product Title -->
                    <h3 class="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2 leading-tight">${product.name}</h3>
                    
                    <!-- Description -->
                    <p class="text-gray-600 text-sm line-clamp-2 leading-relaxed">${product.shortDescription || product.description}</p>
                    
                    <!-- Brand -->
                    <div class="flex items-center text-sm text-gray-500">
                        <i class="fas fa-industry mr-2 text-blue-500"></i>
                        <span class="font-medium">${product.brand}</span>
                    </div>
                    
                    <!-- Rating -->
                    ${rating}
                    
                    <!-- Price -->
                    <div class="pt-4 border-t border-gray-100">
                        <div class="flex items-center mb-4">
                            <span class="price-tag text-xl font-bold">${this.formatPrice(product.price)}</span>
                            ${originalPrice}
                        </div>
                        
                        <!-- Action Button -->
                        <button class="view-detail-btn w-full group-hover:scale-105 transition-all duration-300"
                                onclick="event.stopPropagation(); productsManager.viewProduct('${product._id}')">
                            <i class="fas fa-eye mr-2"></i>Xem Chi Tiết
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }
    
    getCategoryLabel(categoryValue) {
        const category = this.categories.find(cat => cat.value === categoryValue);
        return category ? category.label : categoryValue;
    }
    
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }
    
    renderPagination(pagination) {
        const container = document.getElementById('pagination');
        if (!container) return;
        
        if (pagination.totalPages <= 1) {
            container.classList.add('hidden');
            return;
        }
        
        container.classList.remove('hidden');
        
        let paginationHTML = '';
        
        // Previous button
        if (pagination.hasPrev) {
            paginationHTML += `
                <button class="px-4 py-2 mx-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        onclick="productsManager.goToPage(${pagination.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>
            `;
        }
        
        // Page numbers
        const startPage = Math.max(1, pagination.currentPage - 2);
        const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);
        
        if (startPage > 1) {
            paginationHTML += `
                <button class="px-4 py-2 mx-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        onclick="productsManager.goToPage(1)">1</button>
            `;
            if (startPage > 2) {
                paginationHTML += '<span class="px-2 py-2 mx-1">...</span>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === pagination.currentPage;
            paginationHTML += `
                <button class="px-4 py-2 mx-1 rounded-lg transition-colors ${
                    isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                }" onclick="productsManager.goToPage(${i})">${i}</button>
            `;
        }
        
        if (endPage < pagination.totalPages) {
            if (endPage < pagination.totalPages - 1) {
                paginationHTML += '<span class="px-2 py-2 mx-1">...</span>';
            }
            paginationHTML += `
                <button class="px-4 py-2 mx-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        onclick="productsManager.goToPage(${pagination.totalPages})">${pagination.totalPages}</button>
            `;
        }
        
        // Next button
        if (pagination.hasNext) {
            paginationHTML += `
                <button class="px-4 py-2 mx-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        onclick="productsManager.goToPage(${pagination.currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }
        
        container.innerHTML = paginationHTML;
    }
    
    updateProductsCount() {
        const countElement = document.getElementById('products-count');
        if (countElement) {
            countElement.textContent = `${this.totalProducts} sản phẩm`;
        }
    }
    
    setupEventListeners() {
        // Category filters
        document.addEventListener('click', (e) => {
            if (e.target.closest('.category-filter')) {
                const button = e.target.closest('.category-filter');
                const category = button.getAttribute('data-category');
                this.filterByCategory(category);
            }
        });
        
        
        // Sort
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.currentPage = 1;
                this.loadProducts();
            });
        }
        
        // Products per page
        const perPageSelect = document.getElementById('products-per-page');
        if (perPageSelect) {
            perPageSelect.addEventListener('change', (e) => {
                this.productsPerPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.loadProducts();
            });
        }
        
        // Featured and stock filters
        const featuredCheckbox = document.getElementById('featured-only');
        const stockCheckbox = document.getElementById('in-stock-only');
        
        if (featuredCheckbox) {
            featuredCheckbox.addEventListener('change', (e) => {
                this.currentFilters.featured = e.target.checked;
                this.currentPage = 1;
                this.loadProducts();
            });
        }
        
        if (stockCheckbox) {
            stockCheckbox.addEventListener('change', (e) => {
                this.currentFilters.inStock = e.target.checked;
                this.currentPage = 1;
                this.loadProducts();
            });
        }
        
        // Clear filters
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
        }
    }
    
    setupFilterToggles() {
        const filterToggles = document.querySelectorAll('.filter-toggle');

        filterToggles.forEach(toggle => {
            const content = toggle.nextElementSibling;
            const icon = toggle.querySelector('i');

            // Initialize with content visible
            toggle.classList.add('active');
            icon.classList.add('rotate-180');
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.marginTop = '1rem'; // Corresponds to mt-4

            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');

                if (toggle.classList.contains('active')) {
                    icon.classList.add('rotate-180');
                    content.style.maxHeight = content.scrollHeight + 'px';
                    content.style.marginTop = '1rem';
                } else {
                    icon.classList.remove('rotate-180');
                    content.style.maxHeight = '0px';
                    content.style.marginTop = '0';
                }
            });
        });
    }

    setupSearch() {
        const heroSearch = document.getElementById('hero-search');
        const heroSearchBtn = document.getElementById('hero-search-btn');
        
        if (heroSearch && heroSearchBtn) {
            const performSearch = () => {
                this.currentFilters.search = heroSearch.value.trim();
                this.currentPage = 1;
                this.loadProducts();
            };
            
            heroSearchBtn.addEventListener('click', performSearch);
            heroSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }
    }
    
    filterByCategory(category) {
        // Update active button
        document.querySelectorAll('.category-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // Apply filter
        this.currentFilters.category = category;
        this.currentPage = 1;
        this.loadProducts();
    }
    
    setupPriceSlider() {
        const minPriceRange = document.getElementById('min-price-range');
        const maxPriceRange = document.getElementById('max-price-range');
        const minPriceDisplay = document.getElementById('min-price-display');
        const maxPriceDisplay = document.getElementById('max-price-display');
        const applyPriceFilterBtn = document.getElementById('apply-price-filter');

        if (!minPriceRange || !maxPriceRange) return;

        // Set initial values
        minPriceRange.value = this.currentFilters.minPrice || 0;
        maxPriceRange.value = this.currentFilters.maxPrice || 100000000;

        // Update displays
        const updateDisplays = () => {
            const minVal = parseInt(minPriceRange.value);
            const maxVal = parseInt(maxPriceRange.value);
            
            // Ensure min doesn't exceed max
            if (minVal > maxVal) {
                minPriceRange.value = maxVal;
            }
            
            // Ensure max doesn't go below min
            if (maxVal < minVal) {
                maxPriceRange.value = minVal;
            }
            
            minPriceDisplay.textContent = this.formatPrice(minPriceRange.value);
            maxPriceDisplay.textContent = this.formatPrice(maxPriceRange.value);
        };

        // Add event listeners for real-time display updates
        minPriceRange.addEventListener('input', updateDisplays);
        maxPriceRange.addEventListener('input', updateDisplays);

        // Initial display update
        updateDisplays();

        // Apply filter button
        if (applyPriceFilterBtn) {
            applyPriceFilterBtn.addEventListener('click', () => {
                this.currentFilters.minPrice = parseInt(minPriceRange.value);
                this.currentFilters.maxPrice = parseInt(maxPriceRange.value);
                this.currentPage = 1;
                this.loadProducts();
            });
        }
    }
    
    clearAllFilters() {
        // Reset filters
        this.currentFilters = {
            category: '',
            minPrice: '',
            maxPrice: '',
            search: '',
            sort: '-createdAt',
            featured: false,
            inStock: false
        };
        this.currentPage = 1;
        
        // Reset UI
        document.querySelectorAll('.category-filter').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-category=""]').classList.add('active');
        if (this.priceSlider) {
            this.priceSlider.reset();
        }
        document.getElementById('hero-search').value = '';
        document.getElementById('sort-select').value = '-createdAt';
        document.getElementById('featured-only').checked = false;
        document.getElementById('in-stock-only').checked = false;
        
        this.loadProducts();
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.loadProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    viewProduct(productId) {
        window.location.href = `/product-detail.html?id=${productId}`;
    }
    
    showLoading() {
        document.getElementById('loading-state').classList.remove('hidden');
        document.getElementById('products-grid').classList.add('hidden');
        document.getElementById('no-products-state').classList.add('hidden');
    }
    
    hideLoading() {
        document.getElementById('loading-state').classList.add('hidden');
    }
    
    showError(message) {
        // Create a simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productsManager = new ProductsManager();
});

// Add CSS for line clamp and no image placeholder
const style = document.createElement('style');
style.textContent = `
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .no-image-placeholder {
        width: 100%;
        height: 18rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        color: #6b7280;
        font-size: 1.125rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border: 2px dashed #d1d5db;
        position: relative;
    }
    
    .no-image-placeholder::before {
        content: '📷';
        font-size: 2rem;
        margin-right: 0.5rem;
        opacity: 0.5;
    }
`;
document.head.appendChild(style);

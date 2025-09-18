// Product detail page functionality
class ProductDetailManager {
    constructor() {
        this.productId = null;
        this.product = null;
        this.currentImageIndex = 0;
        
        this.init();
    }
    
    async init() {
        try {
            this.productId = this.getProductIdFromUrl();
            if (!this.productId) {
                this.showError();
                return;
            }
            
            await this.loadProduct();
            this.setupEventListeners();
            this.setupImageZoom();
            this.setupTabs();
        } catch (error) {
            console.error('Error initializing product detail page:', error);
            this.showError();
        }
    }
    
    getProductIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }
    
    async loadProduct() {
        try {
            const response = await fetch(`/api/products/${this.productId}`);
            const data = await response.json();
            
            if (data.success) {
                this.product = data.data;
                this.renderProduct();
                await this.loadRelatedProducts();
            } else {
                throw new Error(data.message || 'Không thể tải thông tin sản phẩm');
            }
            
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError();
        }
    }
    
    renderProduct() {
        // Hide loading, show product
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('product-detail').classList.remove('hidden');
        
        // Update page title
        document.title = `${this.product.name} - SolarAnalytics`;
        
        // Breadcrumb
        document.getElementById('product-breadcrumb').textContent = this.product.name;
        
        // Category & Brand
        document.getElementById('product-category').textContent = this.getCategoryLabel(this.product.category);
        document.querySelector('#product-brand span').textContent = this.product.brand;
        
        // Title
        document.getElementById('product-title').textContent = this.product.name;
        
        // Rating
        this.renderRating();
        
        // Description
        document.getElementById('product-description').textContent = this.product.description;
        
        // Price
        this.renderPrice();
        
        // Stock status
        this.renderStockStatus();
        
        // Images
        this.renderImages();
        
        // Features
        this.renderFeatures();
        
        // Specifications
        this.renderSpecifications();
        
        // Applications
        this.renderApplications();
        
        // Warranty
        this.renderWarranty();
    }
    
    renderRating() {
        const ratingContainer = document.getElementById('product-rating');
        
        if (this.product.rating && this.product.rating.count > 0) {
            ratingContainer.innerHTML = `
                <div class="flex items-center modern-card p-4 rounded-xl">
                    <div class="flex rating-stars mr-3 text-xl">
                        ${this.renderStars(this.product.rating.average)}
                    </div>
                    <div class="flex flex-col">
                        <span class="text-gray-800 font-bold text-lg">${this.product.rating.average.toFixed(1)}</span>
                        <span class="text-gray-500 text-sm">${this.product.rating.count} đánh giá</span>
                    </div>
                </div>
            `;
        } else {
            ratingContainer.innerHTML = `
                <div class="modern-card p-4 rounded-xl text-gray-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <span>Chưa có đánh giá</span>
                </div>
            `;
        }
    }
    
    renderPrice() {
        const priceElement = document.getElementById('product-price');
        const originalPriceElement = document.getElementById('original-price');
        
        priceElement.textContent = this.formatPrice(this.product.price);
        
        if (this.product.originalPrice && this.product.originalPrice > this.product.price) {
            originalPriceElement.classList.remove('hidden');
            originalPriceElement.querySelector('span').textContent = this.formatPrice(this.product.originalPrice);
            originalPriceElement.querySelector('.discount-badge').textContent = `-${this.product.discountPercentage}%`;
        }
    }
    
    renderStockStatus() {
        const stockElement = document.getElementById('stock-status');
        
        if (this.product.inStock) {
            stockElement.innerHTML = `
                <div class="stock-badge flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                    <span class="font-semibold">Còn hàng</span>
                    ${this.product.stockQuantity > 0 ? `<span class="ml-2 opacity-80">(${this.product.stockQuantity} sản phẩm)</span>` : ''}
                </div>
            `;
        } else {
            stockElement.innerHTML = `
                <div class="stock-badge out-of-stock flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
                    <span class="font-semibold">Hết hàng</span>
                </div>
            `;
        }
    }
    
    renderImages() {
        if (!this.product.images || this.product.images.length === 0) {
            document.getElementById('main-image').src = '/assets/placeholder-product.jpg';
            return;
        }
        
        // Main image
        const mainImage = document.getElementById('main-image');
        mainImage.src = this.product.images[0].url;
        mainImage.alt = this.product.images[0].alt;
        
        // Thumbnails
        const thumbnailsContainer = document.getElementById('thumbnails');
        thumbnailsContainer.innerHTML = this.product.images.map((image, index) => `
            <img src="${image.url}" alt="${image.alt}" 
                 class="thumbnail w-20 h-20 object-cover rounded-lg cursor-pointer ${index === 0 ? 'active' : ''}"
                 onclick="productDetailManager.changeImage(${index})"
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI0MCIgeT0iNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2YjcyODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'; this.alt='No Image'">
        `).join('');
    }
    
    renderFeatures() {
        const featuresContainer = document.getElementById('features-list');
        
        if (!this.product.features || this.product.features.length === 0) {
            document.getElementById('product-features').style.display = 'none';
            return;
        }
        
        featuresContainer.innerHTML = this.product.features.map(feature => `
            <div class="feature-item p-3 rounded-lg flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                <span>${feature}</span>
            </div>
        `).join('');
    }
    
    renderSpecifications() {
        const specsContainer = document.getElementById('specifications-grid');
        const specs = this.product.specifications || {};
        
        const specItems = [
            { key: 'power', label: 'Công Suất', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5.268l4.06-4.06a1 1 0 011.414 1.414l-4.06 4.06H18a1 1 0 011 1v4a1 1 0 01-1 1h-5.268l4.06 4.06a1 1 0 01-1.414 1.414l-4.06-4.06V18a1 1 0 01-1.7.707l-8-8a1 1 0 010-1.414l8-8A1 1 0 0111.3 1.046zM12 4.414L6.414 10 12 15.586V14a1 1 0 011-1h2.586l-4.293-4.293A1 1 0 0111 8V4.414z" clip-rule="evenodd" /></svg>' },
            { key: 'efficiency', label: 'Hiệu Suất', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-3" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg>' },
            { key: 'warranty', label: 'Bảo Hành', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5.052a11.954 11.954 0 01-1.122 3.992A11.954 11.954 0 0110 18.056a11.954 11.954 0 019.056-9.012A11.954 11.954 0 0110 1.944zM9 13a1 1 0 112 0v2a1 1 0 11-2 0v-2zm1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>' },
            { key: 'dimensions', label: 'Kích Thước', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clip-rule="evenodd" /></svg>' },
            { key: 'weight', label: 'Trọng Lượng', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 00-1 1v1.333a1 1 0 00.528.884l1.666.833a1 1 0 001.342-.833V4a1 1 0 00-1-1zm-3.5 1.414a1 1 0 011.414 0L10 6.586l2.086-2.172a1 1 0 111.414 1.414L11.414 8l2.172 2.086a1 1 0 11-1.414 1.414L10 9.414l-2.086 2.172a1 1 0 11-1.414-1.414L8.586 8 6.414 5.914a1 1 0 010-1.414zM10 17a7 7 0 110-14 7 7 0 010 14z" clip-rule="evenodd" /></svg>' },
            { key: 'material', label: 'Vật Liệu', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a2 2 0 00-2 2v12a2 2 0 002 2h1a2 2 0 002-2V4a2 2 0 00-2-2h-1zM3 5a2 2 0 00-2 2v8a2 2 0 002 2h1a2 2 0 002-2V7a2 2 0 00-2-2H3zM15 5a2 2 0 00-2 2v8a2 2 0 002 2h1a2 2 0 002-2V7a2 2 0 00-2-2h-1z" /></svg>' },
            { key: 'certification', label: 'Chứng Nhận', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>' }
        ];
        
        const validSpecs = specItems.filter(item => specs[item.key]);
        
        if (validSpecs.length === 0) {
            specsContainer.innerHTML = '<p class="text-gray-500 col-span-2">Chưa có thông số kỹ thuật</p>';
            return;
        }
        
        specsContainer.innerHTML = validSpecs.map(item => `
            <div class="spec-item p-4 rounded-lg">
                <div class="flex items-center mb-2">
                    ${item.icon}
                    <span class="font-semibold text-gray-800">${item.label}</span>
                </div>
                <p class="text-gray-600">${specs[item.key]}</p>
            </div>
        `).join('');
    }
    
    renderApplications() {
        const applicationsContainer = document.getElementById('applications-list');
        
        if (!this.product.applications || this.product.applications.length === 0) {
            applicationsContainer.innerHTML = '<p class="text-gray-500">Chưa có thông tin ứng dụng</p>';
            return;
        }
        
        applicationsContainer.innerHTML = this.product.applications.map((application, index) => `
            <div class="modern-card bg-gradient-to-br from-blue-50 to-cyan-100 border border-blue-200 p-6 hover:shadow-lg transition-all duration-300" style="animation-delay: ${index * 0.1}s">
                <div class="flex items-center">
                    <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM4.343 5.757a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM11 16a1 1 0 10-2 0v1a1 1 0 102 0v-1zM4.343 14.243a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM15.657 14.243a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM10 5a1 1 0 011 1v6a1 1 0 11-2 0V6a1 1 0 011-1z" /></svg>
                    </div>
                    <div>
                        <span class="text-blue-800 font-semibold text-lg">${application}</span>
                        <div class="w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mt-2"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    renderWarranty() {
        const warrantyContainer = document.getElementById('warranty-info');
        const warranty = this.product.specifications?.warranty || 'Liên hệ để biết thêm thông tin bảo hành';
        
        warrantyContainer.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" /></svg>
                    <span class="font-medium">Thời gian bảo hành: ${warranty}</span>
                </div>
                <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg>
                    <span>Bảo hành tại tất cả các trung tâm bảo hành ủy quyền</span>
                </div>
                <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.518.76a11.034 11.034 0 006.364 6.364l.76-1.518a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                    <span>Hotline: 0979900874</span>
                </div>
                <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                    <span>Email: pxmanhctc@gmail.com</span>
                </div>
                <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path d="M10 20a10 10 0 110-20 10 10 0 010 20zM10 8a2 2 0 100-4 2 2 0 000 4zm0 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                    <span>Hỗ trợ kỹ thuật 24/7</span>
                </div>
            </div>
        `;
    }
    
    async loadRelatedProducts() {
        try {
            const response = await fetch(`/api/products?category=${this.product.category}&limit=4`);
            const data = await response.json();
            
            if (data.success) {
                // Filter out current product
                const relatedProducts = data.data.products.filter(p => p._id !== this.product._id);
                this.renderRelatedProducts(relatedProducts.slice(0, 4));
            }
        } catch (error) {
            console.error('Error loading related products:', error);
        }
    }
    
    renderRelatedProducts(products) {
        const container = document.getElementById('related-products');
        
        if (products.length === 0) {
            container.innerHTML = '<p class="text-gray-500 col-span-4 text-center">Không có sản phẩm liên quan</p>';
            return;
        }
        
        container.innerHTML = products.map(product => this.createRelatedProductCard(product)).join('');
    }
    
    createRelatedProductCard(product) {
        const primaryImage = product.primaryImage || product.images[0];
        const imageUrl = primaryImage ? primaryImage.url : '/assets/placeholder-product.jpg';
        
        return `
            <div class="modern-card overflow-hidden hover:transform hover:scale-105 transition-all duration-300 cursor-pointer group"
                 onclick="window.location.href='/product-detail.html?id=${product._id}'">
                <div class="relative overflow-hidden">
                    <img src="${imageUrl}" alt="${product.name}" 
                         class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                         onerror="this.src='/assets/placeholder-product.jpg'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div class="p-6">
                    <h3 class="font-bold text-gray-800 mb-2 line-clamp-2 text-lg group-hover:text-blue-600 transition-colors">${product.name}</h3>
                    <p class="text-gray-600 text-sm mb-4 line-clamp-2">${product.shortDescription || product.description}</p>
                    <div class="flex items-center justify-between">
                        <div class="flex flex-col">
                            <span class="text-xl font-bold text-green-600">${this.formatPrice(product.price)}</span>
                            <span class="text-xs text-gray-500 mt-1">${product.brand}</span>
                        </div>
                        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Contact button
        const contactBtn = document.getElementById('contact-btn');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => {
                this.showContactModal();
            });
        }
        
        // Share button
        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareProduct());
        }
    }
    
    setupImageZoom() {
        const mainImage = document.getElementById('main-image');
        const zoomModal = document.getElementById('zoom-modal');
        const zoomModalImage = document.getElementById('zoom-modal-image');
        const closeZoom = document.getElementById('close-zoom');
        
        if (mainImage && zoomModal) {
            mainImage.addEventListener('click', () => {
                zoomModalImage.src = mainImage.src;
                zoomModalImage.alt = mainImage.alt;
                zoomModal.classList.remove('hidden');
            });
            
            closeZoom.addEventListener('click', () => {
                zoomModal.classList.add('hidden');
            });
            
            zoomModal.addEventListener('click', (e) => {
                if (e.target === zoomModal) {
                    zoomModal.classList.add('hidden');
                }
            });
        }
    }
    
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Update active button
                tabButtons.forEach(btn => {
                    btn.classList.remove('active', 'border-blue-600', 'text-blue-600');
                    btn.classList.add('border-transparent');
                });
                button.classList.add('active', 'border-blue-600', 'text-blue-600');
                button.classList.remove('border-transparent');
                
                // Show target content
                tabContents.forEach(content => {
                    content.classList.add('hidden');
                });
                document.getElementById(`${targetTab}-tab`).classList.remove('hidden');
            });
        });
    }
    
    changeImage(index) {
        if (!this.product.images || index >= this.product.images.length) return;
        
        this.currentImageIndex = index;
        
        // Update main image
        const mainImage = document.getElementById('main-image');
        mainImage.src = this.product.images[index].url;
        mainImage.alt = this.product.images[index].alt;
        
        // Update active thumbnail
        document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }

    showContactModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="modern-card p-8 max-w-md w-full mx-4 transform transition-all scale-95 hover:scale-100 duration-300">
            <div class="text-center mb-8">
                <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 floating-animation">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.518.76a11.034 11.034 0 006.364 6.364l.76-1.518a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                </div>
                <h3 class="text-3xl font-bold text-gray-800 mb-3">Liên Hệ Tư Vấn</h3>
                <p class="text-gray-600 text-lg">Chúng tôi sẵn sàng hỗ trợ bạn 24/7</p>
                <div class="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mt-3"></div>
            </div>
            
            <div class="space-y-4 mb-8">
                <div class="modern-card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-5 hover:shadow-lg transition-all duration-300 group">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.518.76a11.034 11.034 0 006.364 6.364l.76-1.518a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                        </div>
                        <div>
                            <p class="font-bold text-gray-800 mb-1">Hotline</p>
                            <a href="tel:0979900874" class="text-blue-600 hover:text-blue-800 font-semibold text-lg transition-colors">0979900874</a>
                        </div>
                    </div>
                </div>
                
                <div class="modern-card bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 p-5 hover:shadow-lg transition-all duration-300 group">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                        </div>
                        <div>
                            <p class="font-bold text-gray-800 mb-1">Email</p>
                            <a href="mailto:pxmanhctc@gmail.com" class="text-green-600 hover:text-green-800 font-semibold transition-colors">pxmanhctc@gmail.com</a>
                        </div>
                    </div>
                </div>
                
                <div class="modern-card bg-gradient-to-br from-yellow-50 to-orange-100 border border-yellow-200 p-5 hover:shadow-lg transition-all duration-300 group">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M10.25 1.25a8.75 8.75 0 100 17.5 8.75 8.75 0 000-17.5zM7.61 5.44a.75.75 0 011.06-.1l3.01 2.5a.75.75 0 010 1.2l-3.01 2.5a.75.75 0 11-.96-1.16l1.9-1.58-1.9-1.58a.75.75 0 01-.1-1.06z"/></svg>
                        </div>
                        <div>
                            <p class="font-bold text-gray-800 mb-1">Zalo</p>
                            <a href="https://zalo.me/0979900874" target="_blank" class="text-blue-600 hover:text-blue-800 font-semibold transition-colors">Chat ngay</a>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex gap-4">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        class="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold">
                    Đóng
                </button>
                <a href="tel:0979900874" 
                   class="contact-btn flex-1 px-6 py-3 text-white rounded-xl text-center font-semibold flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.518.76a11.034 11.034 0 006.364 6.364l.76-1.518a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>Gọi ngay
                </a>
            </div>
        </div>
    `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    shareProduct() {
        if (navigator.share) {
            navigator.share({
                title: this.product.name,
                text: this.product.shortDescription,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showNotification('Đã sao chép liên kết sản phẩm!', 'success');
            });
        }
    }

    getCategoryLabel(categoryValue) {
        const categories = {
            'solar-panels': 'Tấm Pin Mặt Trời',
            'inverters': 'Inverter',
            'batteries': 'Pin Lưu Trữ',
            'mounting-systems': 'Hệ Thống Lắp Đặt',
            'monitoring': 'Giám Sát',
            'accessories': 'Phụ Kiện'
        };
        return categories[categoryValue] || categoryValue;
    }
    
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }
    
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.25 && rating % 1 < 0.75;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        const starIcon = (path) => `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="${path}" /></svg>`;
        const fullStarPath = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';
        const halfStarPath = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';
        const emptyStarPath = 'M10 15.27l-4.24 2.27.81-4.72-3.45-3.36 4.74-.68L10 5l2.14 4.28 4.74.68-3.45 3.36.81 4.72L10 15.27z';

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += starIcon(fullStarPath);
        }
        if (hasHalfStar) {
            stars += `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        <path fill-rule="evenodd" d="M10 15.27l-4.24 2.27.81-4.72-3.45-3.36 4.74-.68L10 5l2.14 4.28 4.74.68-3.45 3.36.81 4.72L10 15.27z" clip-rule="evenodd" opacity="0.5"/>
                      </svg>`;
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path d="${fullStarPath}" /></svg>`;
        }
        
        return stars;
    }
    
    showError() {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('product-detail').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        const icons = {
            success: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>',
            error: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>',
            info: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>'
        };

        notification.innerHTML = `
            <div class="flex items-center">
                ${icons[type] || icons['info']}
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 hover:opacity-75">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                </button>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productDetailManager = new ProductDetailManager();
});

// Add CSS for line clamp
const style = document.createElement('style');
style.textContent = `
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
`;
document.head.appendChild(style);

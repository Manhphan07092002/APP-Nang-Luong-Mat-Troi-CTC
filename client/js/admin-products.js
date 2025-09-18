// Admin Products Management
class AdminProductsManager {
    constructor() {
        this.currentPage = 1;
        this.productsPerPage = 10;
        this.currentFilters = {
            search: '',
            category: '',
            isActive: ''
        };
        this.products = [];
        this.totalProducts = 0;
        this.totalPages = 0;
        this.editingProduct = null;
        this.productImageFiles = []; // Files mới chờ upload
        this.existingImages = []; // Ảnh đã có của sản phẩm đang sửa

        this.adminToken = localStorage.getItem('adminToken');
        this.authHeaders = {
            'Authorization': `Bearer ${this.adminToken}`
        }; 
        // Content-Type sẽ được set tự động bởi browser khi dùng FormData

        this.init();
    }
    async init() {
        this.imageUploadArea = document.getElementById('image-upload-area');
        this.imageInput = document.getElementById('product-images-input');
        this.imagePreviewContainer = document.getElementById('image-preview-container');
        
        this.imageUploadSetupDone = false; // Cờ để đảm bảo chỉ setup 1 lần
        try {
            await this.loadProducts();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing admin products page:', error);
            this.showError('Có lỗi xảy ra khi khởi tạo trang quản lý sản phẩm');
        }
    }
    
        
    async loadProducts() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.productsPerPage
            });
            
            // Add filters
            if (this.currentFilters.search) params.append('search', this.currentFilters.search);
            if (this.currentFilters.category) params.append('category', this.currentFilters.category);
            if (this.currentFilters.isActive !== '') params.append('isActive', this.currentFilters.isActive);
            
            const response = await fetch(`/api/products/admin/all?${params}`, {
                headers: this.authHeaders
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.products = data.data.products;
                this.totalProducts = data.data.pagination.totalProducts;
                this.totalPages = data.data.pagination.totalPages;
                
                this.renderProducts();
                this.renderPagination(data.data.pagination);
                this.updateProductsCount();
            } else {
                throw new Error(data.message || 'Không thể tải danh sách sản phẩm');
            }
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Có lỗi xảy ra khi tải danh sách sản phẩm');
        } finally {
            this.hideLoading();
        }
    }
    
    renderProducts() {
        const tbody = document.getElementById('products-tbody');
        const table = document.getElementById('products-table');
        const emptyState = document.getElementById('empty-state');
        
        if (!tbody) return;
        
        if (this.products.length === 0) {
            table.classList.add('d-none');
            emptyState.classList.remove('d-none');
            return;
        }
        
        table.classList.remove('d-none');
        emptyState.classList.add('d-none');
        
        tbody.innerHTML = this.products.map(product => this.createProductRow(product)).join('');
    }
    
    createProductRow(product) {
        const primaryImage = product.primaryImage || (product.images && product.images[0]);
        const hasImage = primaryImage && primaryImage.url;
        const imageUrl = hasImage ? primaryImage.url : '/assets/placeholder-product.jpg';
        
        const statusClass = product.isActive ? 'status-active' : 'status-inactive';
        const statusText = product.isActive ? 'Hoạt động' : 'Không hoạt động';
        
        const createdDate = new Date(product.createdAt).toLocaleDateString('vi-VN');
        
        return `
            <tr class="product-row border-b border-gray-100">
                <td class="p-4">
                    <div class="d-flex align-items-center justify-content-start">
                        ${hasImage
                            ? `<img src="${imageUrl}" alt="${product.name}"
                                   class="w-12 h-12 object-cover rounded-lg"
                                   onerror="this.outerHTML='\\n<div class=\\'w-12 h-12 rounded-lg bg-light d-flex align-items-center justify-content-center text-muted\\' style=\\'font-size:10px;border:1px solid #e5e7eb;\\'>No Image</div>'">`
                            : `<div class=\"w-12 h-12 rounded-lg bg-light d-flex align-items-center justify-content-center text-muted\" style=\"font-size:10px;border:1px solid #e5e7eb;\">No Image</div>`
                        }
                    </div>
                </td>
                <td class="p-4">
                    <div class="font-medium text-gray-800">${product.name}</div>
                    <div class="text-sm text-gray-500">${product.model}</div>
                </td>
                <td class="p-4">
                    <span class="text-sm text-gray-600">${this.getCategoryLabel(product.category)}</span>
                </td>
                <td class="p-4">
                    <div class="font-medium text-gray-800">${this.formatPrice(product.price)}</div>
                    ${product.originalPrice && product.originalPrice > product.price ? 
                        `<div class="text-sm text-gray-500 line-through">${this.formatPrice(product.originalPrice)}</div>` : ''}
                </td>
                <td class="p-4">
                    <div class="text-sm">
                        <div class="${product.inStock ? 'text-green-600' : 'text-red-600'} font-medium">
                            ${product.inStock ? 'Còn hàng' : 'Hết hàng'}
                        </div>
                        <div class="text-gray-500">${product.stockQuantity || 0} sản phẩm</div>
                    </div>
                </td>
                <td class="p-4">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td class="p-4 text-sm text-gray-600">
                    ${createdDate}
                </td>
                <td class="p-4">
                    <div class="flex items-center space-x-2">
                        <button onclick="adminProductsManager.editProduct('${product._id}')" 
                                class="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="adminProductsManager.deleteProduct('${product._id}')" 
                                class="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                        <a href="/product-detail.html?id=${product._id}" target="_blank"
                           class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                           title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </a>
                    </div>
                </td>
            </tr>
        `;
    }
    
    renderPagination(pagination) {
        const container = document.getElementById('pagination');
        if (!container) return;
        
        if (pagination.totalPages <= 1) {
            container.classList.add('hidden');
            return;
        }
        
        container.classList.remove('hidden');
        
        let paginationHTML = '<div class="flex justify-center items-center space-x-2">';
        
        // Previous button
        if (pagination.hasPrev) {
            paginationHTML += `
                <button class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        onclick="adminProductsManager.goToPage(${pagination.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>
            `;
        }
        
        // Page numbers
        const startPage = Math.max(1, pagination.currentPage - 2);
        const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === pagination.currentPage;
            paginationHTML += `
                <button class="px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'border border-gray-300 hover:bg-gray-50'
                }" onclick="adminProductsManager.goToPage(${i})">${i}</button>
            `;
        }
        
        // Next button
        if (pagination.hasNext) {
            paginationHTML += `
                <button class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        onclick="adminProductsManager.goToPage(${pagination.currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }
        
        paginationHTML += '</div>';
        container.innerHTML = paginationHTML;
    }
    
    updateProductsCount() {
        const countElement = document.getElementById('products-count');
        if (countElement) {
            countElement.textContent = `Tổng: ${this.totalProducts} sản phẩm`;
        }
    }
    
    setupEventListeners() {
        // Add product button
        const addBtn = document.getElementById('add-product-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showProductModal());
        }
        
        // Apply filters button
        const applyFiltersBtn = document.getElementById('apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }
        
        // Search input (enter key)
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyFilters();
                }
            });
        }
        
        // Modal events
        this.setupModalEvents();
    }
    
    setupModalEvents() {
        // Close modal buttons
        const closeModal = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-btn');
        
        if (closeModal) closeModal.addEventListener('click', () => this.hideProductModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideProductModal());
        
        // Product form submit
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProduct();
            });
        }
        
        // Delete modal events
        const cancelDelete = document.getElementById('cancel-delete');
        const confirmDelete = document.getElementById('confirm-delete');
        
        if (cancelDelete) cancelDelete.addEventListener('click', () => this.hideDeleteModal());
        if (confirmDelete) confirmDelete.addEventListener('click', () => this.confirmDelete());
        
        // Click outside modal to close
        const productModal = document.getElementById('product-modal');
        const deleteModal = document.getElementById('delete-modal');
        
        if (productModal) {
            productModal.addEventListener('click', (e) => {
                if (e.target === productModal) this.hideProductModal();
            });
        }
        
        if (deleteModal) {
            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) this.hideDeleteModal();
            });
        }
    }
    
    applyFilters() {
        this.currentFilters.search = document.getElementById('search-input').value.trim();
        this.currentFilters.category = document.getElementById('category-filter').value;
        this.currentFilters.isActive = document.getElementById('status-filter').value;
        
        this.currentPage = 1;
        this.loadProducts();
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.loadProducts();
    }
    
    showProductModal(product = null) {
        this.editingProduct = product;
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('modal-title');
        const saveBtn = document.getElementById('save-btn-text');
        
        if (product) {
            title.textContent = 'Chỉnh Sửa Sản Phẩm';
            saveBtn.textContent = 'Cập Nhật Sản Phẩm';
            this.populateForm(product);
        } else {
            title.textContent = 'Thêm Sản Phẩm Mới';
            saveBtn.textContent = 'Lưu Sản Phẩm';
            this.clearForm();
        }
        this.updateImageUploadLimit();
        
        this.productModal = modal;
        modal.classList.remove('hidden');
        if (!this.imageUploadSetupDone) {
            this.setupImageUpload();
            this.imageUploadSetupDone = true;
        }
        document.body.style.overflow = 'hidden';
    }
    
    hideProductModal() {
        const modal = document.getElementById('product-modal');
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        this.editingProduct = null;
        this.clearForm();
    }
    
    populateForm(product) {
        document.getElementById('product-name').value = product.name || '';
        document.getElementById('product-short-description').value = product.shortDescription || '';
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-category').value = product.category || '';
        document.getElementById('product-brand').value = product.brand || '';
        document.getElementById('product-model').value = product.model || '';
        document.getElementById('product-price').value = product.price || '';
        document.getElementById('product-original-price').value = product.originalPrice || '';
        document.getElementById('product-stock').value = product.stockQuantity || 0;
        document.getElementById('product-in-stock').checked = product.inStock || false;
        document.getElementById('product-featured').checked = product.isFeatured || false;
        
        // Populate specifications
        if (product.specifications) {
            document.getElementById('spec-power').value = product.specifications.power || '';
            document.getElementById('spec-efficiency').value = product.specifications.efficiency || '';
            document.getElementById('spec-warranty').value = product.specifications.warranty || '';
            document.getElementById('spec-dimensions').value = product.specifications.dimensions || '';
            document.getElementById('spec-weight').value = product.specifications.weight || '';
            document.getElementById('spec-material').value = product.specifications.material || '';
        }
        
        // Populate features and images
        this.populateFeatures(product.features || []);
        this.renderExistingImages(product.images || []);
    }
    
    clearForm() {
        document.getElementById('product-form').reset();
        this.clearFeatures();
        this.clearImagePreviews();
    }
    
    populateFeatures(features) {
        this.clearFeatures();
        const container = document.getElementById('features-container');
        
        features.forEach(feature => {
            this.addFeatureRow(feature);
        });
    }
    
    renderExistingImages(images = []) {
        this.existingImages = [...images];
        this.imagePreviewContainer.innerHTML = ''; // Xóa preview cũ

        this.existingImages.forEach((image, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item existing-image';
            previewItem.dataset.imageUrl = image.url;

            const img = document.createElement('img');
            img.src = image.url; // Use the relative path directly
            img.onerror = () => img.src = '/assets/placeholder-product.jpg';

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = () => this.removeImage(null, image.url);

            previewItem.appendChild(img);
            previewItem.appendChild(removeBtn);
            this.imagePreviewContainer.appendChild(previewItem);
        });
    }
    
    clearFeatures() {
        const container = document.getElementById('features-container');
        const firstRow = container.querySelector('.flex');
        firstRow.querySelector('input').value = '';
        
        // Remove additional rows
        const additionalRows = container.querySelectorAll('.flex:not(:first-child)');
        additionalRows.forEach(row => row.remove());
    }
    
    clearImagePreviews() {
        this.productImageFiles = [];
        this.existingImages = [];
        if(this.imagePreviewContainer) {
            this.imagePreviewContainer.innerHTML = '';
        }
        if(this.imageInput) {
            this.imageInput.value = ''; // Reset input file
        }
    }
    
    async saveProduct() {
        try {
            const saveBtn = document.getElementById('save-btn');
            const saveBtnText = document.getElementById('save-btn-text');
            const spinner = saveBtn.querySelector('.loading-spinner');
            
            // Show loading
            spinner.classList.remove('hidden');
            saveBtnText.textContent = this.editingProduct ? 'Đang cập nhật...' : 'Đang lưu...';
            saveBtn.disabled = true;
            
            const formData = this.getFormData();
            
            // Debug: Log FormData contents
            console.log('=== FRONTEND DEBUG ===');
            console.log('Editing product:', this.editingProduct);
            console.log('Product image files:', this.productImageFiles);
            console.log('Existing images:', this.existingImages);
            for (let [key, value] of formData.entries()) {
                console.log(`FormData ${key}:`, value);
            }

            const url = this.editingProduct
                ? `/api/products/${this.editingProduct._id}`
                : '/api/products';
            const method = this.editingProduct ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: this.authHeaders, // Không có 'Content-Type'
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess(data.message || (this.editingProduct ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!'));
                this.hideProductModal();
                this.loadProducts();
            } else {
                // Ném lỗi với thông tin chi tiết hơn
                const errorMessage = data.errors ? data.errors.join(', ') : data.message;
                console.error('Validation errors from server:', data.errors);
                throw new Error(errorMessage || 'Có lỗi xảy ra khi lưu sản phẩm');
            }
            
        } catch (error) {
            console.error('Error saving product:', error);
            this.showError(error.message || 'Có lỗi xảy ra khi lưu sản phẩm');
        } finally {
            // Hide loading
            const saveBtn = document.getElementById('save-btn');
            const saveBtnText = document.getElementById('save-btn-text');
            const spinner = saveBtn.querySelector('.loading-spinner');
            
            spinner.classList.add('hidden');
            saveBtnText.textContent = this.editingProduct ? 'Cập Nhật Sản Phẩm' : 'Lưu Sản Phẩm';
            saveBtn.disabled = false;
        }
    }
    
    getFormData() {
        const formData = new FormData();

        // Append text fields
        formData.append('name', document.getElementById('product-name').value.trim());
        formData.append('shortDescription', document.getElementById('product-short-description').value.trim());
        formData.append('description', document.getElementById('product-description').value.trim());
        formData.append('category', document.getElementById('product-category').value);
        formData.append('brand', document.getElementById('product-brand').value.trim());
        formData.append('model', document.getElementById('product-model').value.trim());
        formData.append('price', parseFloat(document.getElementById('product-price').value) || 0);
        formData.append('originalPrice', parseFloat(document.getElementById('product-original-price').value) || 0);
        formData.append('stockQuantity', parseInt(document.getElementById('product-stock').value) || 0);
        formData.append('inStock', document.getElementById('product-in-stock').checked);
        formData.append('isFeatured', document.getElementById('product-featured').checked);

        // Append JSON fields as strings
        const specifications = {
            power: document.getElementById('spec-power').value.trim(),
            efficiency: document.getElementById('spec-efficiency').value.trim(),
            warranty: document.getElementById('spec-warranty').value.trim(),
            dimensions: document.getElementById('spec-dimensions').value.trim(),
            weight: document.getElementById('spec-weight').value.trim(),
            material: document.getElementById('spec-material').value.trim()
        };
        // Remove empty specifications before stringifying
        Object.keys(specifications).forEach(key => {
            if (!specifications[key]) {
                delete specifications[key];
            }
        });
        formData.append('specifications', JSON.stringify(specifications));
        formData.append('features', JSON.stringify(this.getFeatures()));

        // Khi chỉnh sửa, gửi lại mảng ảnh hiện có (đầy đủ url và alt)
        if (this.editingProduct) {
            const imagesToKeep = this.existingImages.map(img => ({ url: img.url, alt: img.alt || this.editingProduct.name }));
            formData.append('images', JSON.stringify(imagesToKeep));
        }

        // Append new image files
        this.productImageFiles.forEach(file => {
            formData.append('images', file); // Backend will handle array of files with same name 'images'
        });

        return formData;
    }
    
    getFeatures() {
        const container = document.getElementById('features-container');
        const inputs = container.querySelectorAll('input[type="text"]');
        const features = [];
        
        inputs.forEach(input => {
            const value = input.value.trim();
            if (value) {
                features.push(value);
            }
        });
        
        return features;
    }
    
    // This function is no longer needed as we handle images directly
    // getImages() { ... }
    
    async editProduct(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`, {
                headers: this.authHeaders
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showProductModal(data.data);
            } else {
                throw new Error(data.message || 'Không thể tải thông tin sản phẩm');
            }
            
        } catch (error) {
            console.error('Error loading product for edit:', error);
            this.showError('Có lỗi xảy ra khi tải thông tin sản phẩm');
        }
    }
    
    deleteProduct(productId) {
        this.productToDelete = productId;
        document.getElementById('delete-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    hideDeleteModal() {
        document.getElementById('delete-modal').classList.add('hidden');
        document.body.style.overflow = 'auto';
        this.productToDelete = null;
    }
    
    async confirmDelete() {
        try {
            const response = await fetch(`/api/products/${this.productToDelete}`, {
                method: 'DELETE',
                headers: this.authHeaders
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Xóa sản phẩm thành công!');
                this.hideDeleteModal();

                // Remove product from local state for instant UI update
                this.products = this.products.filter(p => p._id !== this.productToDelete);
                this.totalProducts--;

                // If the current page is now empty and it's not the first page, go back a page
                if (this.products.length === 0 && this.currentPage > 1) {
                    this.currentPage--;
                    this.loadProducts();
                } else {
                    // Otherwise, just re-render the current view
                    this.renderProducts();
                    this.updateProductsCount();
                    // Re-render pagination if needed, or wait for next full load
                }
            } else {
                throw new Error(data.message || 'Có lỗi xảy ra khi xóa sản phẩm');
            }
            
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showError('Có lỗi xảy ra khi xóa sản phẩm');
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
    
    showLoading() {
        document.getElementById('loading-state').classList.remove('d-none');
        document.getElementById('products-table').classList.add('d-none');
        document.getElementById('empty-state').classList.add('d-none');
    }
    
    hideLoading() {
        document.getElementById('loading-state').classList.add('d-none');
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info'} mr-2"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 hover:opacity-75">
                    <i class="fas fa-times"></i>
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
    
    addFeatureRow(value = '') {
        const container = document.getElementById('features-container');
        const row = document.createElement('div');
        row.className = 'flex gap-2';
        row.innerHTML = `
            <input type="text" value="${value}" placeholder="Nhập tính năng..." 
                   class="form-input flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none">
            <button type="button" onclick="this.parentElement.remove()" 
                    class="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700">
                <i class="fas fa-minus"></i>
            </button>
        `;
        container.appendChild(row);
    }
    
    addImageRow(url = '', alt = '') {
        const container = document.getElementById('images-container');
        const row = document.createElement('div');
        row.className = 'flex gap-2';
        row.innerHTML = `
            <input type="url" value="${url}" placeholder="URL hình ảnh..." 
                   class="form-input flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none">
            <input type="text" value="${alt}" placeholder="Mô tả hình..." 
                   class="form-input flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none">
            <button type="button" onclick="this.parentElement.remove()" 
                    class="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700">
                <i class="fas fa-minus"></i>
            </button>
        `;
        container.appendChild(row);
    }
    
    setupImageUpload() {
        if (!this.imageUploadArea) return;

        this.imageUploadArea.addEventListener('click', () => this.imageInput.click());

        this.imageInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Drag and drop listeners
        this.imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.imageUploadArea.classList.add('border-primary');
        });

        this.imageUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.imageUploadArea.classList.remove('border-primary');
        });

        this.imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.imageUploadArea.classList.remove('border-primary');
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });
    }

    handleFiles(files) {
        const newFiles = Array.from(files);
        const totalImages = this.productImageFiles.length + this.existingImages.length + newFiles.length;

        if (totalImages > 5) {
            this.showError(`Bạn chỉ có thể có tối đa 5 ảnh. Hiện tại đã có ${this.productImageFiles.length + this.existingImages.length} ảnh.`);
            return;
        }

        for (const file of newFiles) {
            if (!file.type.startsWith('image/')) {
                this.showError(`Tệp ${file.name} không phải là ảnh.`);
                continue;
            }
            if (this.productImageFiles.some(f => f.name === file.name)) {
                this.showError(`Ảnh ${file.name} đã được thêm.`);
                continue;
            }
            this.productImageFiles.push(file);
            this.renderImagePreview(file);
        }
        this.updateImageUploadLimit();
    }

    renderImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item new-image';
            previewItem.dataset.fileName = file.name;

            const img = document.createElement('img');
            img.src = e.target.result;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = () => this.removeImage(file.name, null);

            previewItem.appendChild(img);
            previewItem.appendChild(removeBtn);
            this.imagePreviewContainer.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    }

    removeImage(fileName, imageUrl) {
        if (fileName) { // Removing a new file
            this.productImageFiles = this.productImageFiles.filter(f => f.name !== fileName);
            const previewItem = this.imagePreviewContainer.querySelector(`[data-file-name="${fileName}"]`);
            if (previewItem) {
                previewItem.remove();
            }
        } else if (imageUrl) { // Removing an existing image
            this.existingImages = this.existingImages.filter(img => img.url !== imageUrl);
            const previewItem = this.imagePreviewContainer.querySelector(`[data-image-url="${imageUrl}"]`);
            if (previewItem) {
                previewItem.remove();
            }
        }
        this.updateImageUploadLimit();
    }

    updateImageUploadLimit() {
        const totalImages = this.productImageFiles.length + this.existingImages.length;
        const uploadText = this.imageUploadArea.querySelector('span');
        if (totalImages >= 5) {
            this.imageUploadArea.classList.add('disabled');
            this.imageInput.disabled = true;
            if(uploadText) uploadText.textContent = 'Đã đạt giới hạn 5 ảnh';
        } else {
            this.imageUploadArea.classList.remove('disabled');
            this.imageInput.disabled = false;
            if(uploadText) uploadText.textContent = `Thêm ảnh (${totalImages}/5)`;
        }
    }
}

// Global functions for dynamic content
function addFeature() {
    if (window.adminProductsManager) {
        window.adminProductsManager.addFeatureRow();
    }
}

// The addImage function is no longer needed as we use the new upload area
// function addImage() { ... }

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    window.location.href = 'login.html';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminProductsManager = new AdminProductsManager();
});

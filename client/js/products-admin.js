document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        console.error('Không tìm thấy token xác thực của admin.');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const productsTableBody = document.getElementById('products-table-body');
    const productModal = new bootstrap.Modal(document.getElementById('productModal'));
    const productForm = document.getElementById('product-form');
    const productModalLabel = document.getElementById('productModalLabel');
    const saveProductBtn = document.getElementById('save-product-btn');

    const fetchProducts = async () => {
        if (!productsTableBody) return;
        productsTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Đang tải dữ liệu...</td></tr>';

        try {
            const response = await fetch('/api/admin/products', { headers }); // Assuming this is the endpoint
            if (!response.ok) {
                throw new Error(`Lỗi HTTP: ${response.status}`);
            }
            const responseData = await response.json();

            if (responseData && responseData.data && Array.isArray(responseData.data.products)) {
                renderProducts(responseData.data.products);
            } else {
                throw new Error('Định dạng dữ liệu sản phẩm không hợp lệ');
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách sản phẩm:', error);
            productsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Không thể tải dữ liệu sản phẩm.</td></tr>';
        }
    };

    const renderProducts = (products) => {
        productsTableBody.innerHTML = '';
        if (products.length === 0) {
            productsTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Không có sản phẩm nào.</td></tr>';
            return;
        }

        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${product.type}</td>
                <td>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-primary me-2" onclick="editProduct('${product._id}')"><i class="fas fa-edit"></i> Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id}')"><i class="fas fa-trash"></i> Xóa</button>
                </td>
            `;
            productsTableBody.appendChild(row);
        });
    };

    const resetForm = () => {
        productForm.reset();
        document.getElementById('productId').value = '';
    };

    document.querySelector('[data-bs-target="#productModal"]').addEventListener('click', () => {
        resetForm();
        productModalLabel.textContent = 'Thêm Sản phẩm';
    });

    saveProductBtn.addEventListener('click', async () => {
        const productId = document.getElementById('productId').value;
        const name = document.getElementById('productName').value;
        const type = document.getElementById('productType').value;
        const price = document.getElementById('productPrice').value;
        const description = document.getElementById('productDescription').value;

        const productData = { name, type, price, description };

        const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products';
        const method = productId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Thao tác thất bại');
            }

            productModal.hide();
            fetchProducts();
        } catch (error) {
            console.error('Lỗi khi lưu sản phẩm:', error);
            alert(`Lỗi: ${error.message}`);
        }
    });

    window.editProduct = async (productId) => {
        resetForm();
        productModalLabel.textContent = 'Chỉnh sửa Sản phẩm';

        try {
            const response = await fetch(`/api/admin/products/${productId}`, { headers });
            if (!response.ok) throw new Error('Không thể lấy thông tin sản phẩm');
            const product = await response.json();

            document.getElementById('productId').value = product._id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productType').value = product.type;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productDescription').value = product.description;

            productModal.show();
        } catch (error) {
            console.error('Lỗi khi sửa sản phẩm:', error);
        }
    };

    window.deleteProduct = async (productId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
                headers: headers
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Xóa thất bại');
            }

            fetchProducts();
        } catch (error) {
            console.error('Lỗi khi xóa sản phẩm:', error);
            alert(`Lỗi: ${error.message}`);
        }
    };

    fetchProducts();
});

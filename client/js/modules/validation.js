export function validateForm(formId) {
    const form = document.getElementById(formId);
    let isValid = true;
    
    // Ví dụ về validation đơn giản
    const nameInput = form.querySelector('#survey-name');
    const nameError = form.querySelector('#survey-name-error');
    if (!nameInput.value.trim()) {
        nameError.textContent = 'Tên khách hàng là bắt buộc.';
        isValid = false;
    } else {
        nameError.textContent = '';
    }

    // Thêm các quy tắc validation khác cho các trường còn lại ở đây
    
    return isValid;
}
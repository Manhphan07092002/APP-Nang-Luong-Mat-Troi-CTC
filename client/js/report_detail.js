// File: client/js/report_detail.js

import { renderReport } from './modules/reportRenderer.js';

document.addEventListener('DOMContentLoaded', async () => {
    const resultContainer = document.getElementById('result-container');
    const placeholder = document.getElementById('report-content-placeholder');
    
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('id');

    if (!shareId) {
        placeholder.innerHTML = '<p class="text-center text-red-500">Lỗi: Không tìm thấy ID báo cáo trong địa chỉ URL.</p>';
        return;
    }

    try {
        const response = await fetch(`/api/reports/share/${shareId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể tải chi tiết báo cáo.');
        }
        const reportData = await response.json();

        renderReport(resultContainer, reportData);
        if (placeholder) {
            placeholder.classList.add('hidden');
        }

    } catch (error) {
        if (placeholder) {
            placeholder.innerHTML = `<p class="text-center text-red-500">Đã xảy ra lỗi: ${error.message}</p>`;
        }
    }
});
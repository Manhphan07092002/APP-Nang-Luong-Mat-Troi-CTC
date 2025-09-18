import { renderReport } from './modules/reportRenderer.js';

document.addEventListener('DOMContentLoaded', async () => {
    const resultContainer = document.getElementById('result-container');
    
    // Lấy shareId từ URL, ví dụ: report_detail.html?id=abcdef
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('id');

    if (!shareId) {
        resultContainer.innerHTML = '<p class="text-center text-red-500">Không tìm thấy ID báo cáo.</p>';
        return;
    }

    try {
        // Gọi API mới để lấy chi tiết báo cáo
        const response = await fetch(`/api/reports/share/${shareId}`);
        if (!response.ok) {
            throw new Error('Không tìm thấy báo cáo hoặc có lỗi xảy ra.');
        }
        const reportData = await response.json();

        // Sử dụng hàm render chung để hiển thị kết quả
        renderReport(resultContainer, reportData);

    } catch (error) {
        resultContainer.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
    }
});
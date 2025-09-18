import { checkAdmin, fetchWithAuth } from './authAdmin.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAdmin()) return;
    const statsGrid = document.getElementById('stats-grid');

    async function loadStats() {
        const response = await fetchWithAuth('/api/admin/stats');
        const stats = await response.json();
        statsGrid.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow"><h3 class="text-gray-500">Lượt truy cập</h3><p class="text-3xl font-bold">${stats.totalVisits}</p></div>
            <div class="bg-white p-6 rounded-lg shadow"><h3 class="text-gray-500">Lần phân tích</h3><p class="text-3xl font-bold">${stats.analysesCreated}</p></div>
            <div class="bg-white p-6 rounded-lg shadow"><h3 class="text-gray-500">Lần đăng nhập</h3><p class="text-3xl font-bold">${stats.logins}</p></div>
            <div class="bg-white p-6 rounded-lg shadow"><h3 class="text-gray-500">Tổng số User</h3><p class="text-3xl font-bold">${stats.totalUsers}</p></div>
        `;
    }
    loadStats();
});
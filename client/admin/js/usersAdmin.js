import { checkAdmin, fetchWithAuth } from './authAdmin.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAdmin()) return;
    const tableBody = document.getElementById('users-table-body');

    async function loadUsers() {
        const response = await fetchWithAuth('/api/users');
        const users = await response.json();
        tableBody.innerHTML = users.map(user => `
            <tr>
                <td class="px-6 py-4 border-b">${user.name}</td>
                <td class="px-6 py-4 border-b">${user.email}</td>
                <td class="px-6 py-4 border-b">${user.role}</td>
                <td class="px-6 py-4 border-b text-center">
                    <button class="text-red-500 hover:text-red-700 delete-btn" data-id="${user._id}">Xóa</button>
                </td>
            </tr>
        `).join('');
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('Bạn có chắc muốn xóa người dùng này?')) {
                    await fetchWithAuth(`/api/users/${e.target.dataset.id}`, { method: 'DELETE' });
                    loadUsers();
                }
            });
        });
    }
    loadUsers();
});
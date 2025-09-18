export const userInfo = JSON.parse(localStorage.getItem('userInfo'));

export function checkAdmin() {
    if (!userInfo || !userInfo.token || userInfo.role !== 'admin') {
        alert('Truy cập bị từ chối. Yêu cầu quyền Admin.');
        window.location.href = '/';
        return false;
    }
    return true;
}

export async function fetchWithAuth(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userInfo.token}`,
        ...options.headers,
    };
    return fetch(url, { ...options, headers });
}
/**
 * API Client — Fetch wrapper with JWT token injection.
 * All API calls go through this module.
 */
const API = (() => {
    const BASE = '/api';

    function getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('access_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    async function request(method, path, body = null) {
        const opts = { method, headers: getHeaders() };
        if (body && method !== 'GET') opts.body = JSON.stringify(body);

        let url = `${BASE}${path}`;
        // For GET with query params
        if (method === 'GET' && body) {
            const params = new URLSearchParams();
            Object.entries(body).forEach(([k, v]) => {
                if (v !== null && v !== undefined && v !== '') params.append(k, v);
            });
            const qs = params.toString();
            if (qs) url += `?${qs}`;
            opts.body = undefined;
        }

        const res = await fetch(url, opts);

        // Handle 401 — try refresh
        if (res.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
            const refreshed = await refreshToken();
            if (refreshed) {
                opts.headers = getHeaders();
                const retry = await fetch(url, opts);
                return handleResponse(retry);
            }
            Auth.logout();
            return { success: false, error: 'Session expired.' };
        }

        return handleResponse(res);
    }

    async function handleResponse(res) {
        const data = await res.json().catch(() => ({ success: false, error: 'Invalid response' }));
        if (!res.ok && !data.error) data.error = `Request failed (${res.status})`;
        return data;
    }

    async function refreshToken() {
        const rt = localStorage.getItem('refresh_token');
        if (!rt) return false;
        try {
            const res = await fetch(`${BASE}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: rt }),
            });
            if (!res.ok) return false;
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('access_token', data.data.access_token);
                localStorage.setItem('refresh_token', data.data.refresh_token);
                return true;
            }
            return false;
        } catch { return false; }
    }

    // Upload file (multipart)
    async function upload(path, file) {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${BASE}${path}`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        });
        return handleResponse(res);
    }

    // Download (for PDF export)
    async function download(path, filename) {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${BASE}${path}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (!res.ok) return false;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return true;
    }

    return {
        get: (path, params) => request('GET', path, params),
        post: (path, body) => request('POST', path, body),
        put: (path, body) => request('PUT', path, body),
        patch: (path, body) => request('PATCH', path, body),
        delete: (path) => request('DELETE', path),
        upload,
        download,
    };
})();

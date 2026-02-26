import { useAuth } from '../context/AuthContext';
import { API_URL } from '../lib/config';

/**
 * Hook that returns an authenticated fetch wrapper.
 * Automatically injects Authorization: Bearer <token> header.
 * Usage:
 *   const api = useApi();
 *   const data = await api.get('/products');
 *   const result = await api.post('/orders', { seller_id, items, total_amount });
 */
export function useApi() {
    const { getAccessToken } = useAuth();

    async function request(path, options = {}) {
        const token = await getAccessToken();

        const res = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers,
            },
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || `Request failed: ${res.status}`);
        }
        return data;
    }

    return {
        get: (path) => request(path),
        post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
        patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
        del: (path) => request(path, { method: 'DELETE' }),
    };
}

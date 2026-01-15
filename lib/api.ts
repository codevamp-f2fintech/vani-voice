import { API_BASE_URL } from './config';

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export async function apiFetch<T = any>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!res.ok) {
        const body = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => '');
        const message = isJson ? body?.message || body?.error || JSON.stringify(body) : body;
        throw new ApiError(message || `Request failed: ${res.status}`, res.status);
    }

    return isJson ? res.json() : res.text() as unknown as T;
}

// Convenience methods
export const api = {
    get: <T = any>(endpoint: string) => apiFetch<T>(endpoint),

    post: <T = any>(endpoint: string, data?: any) =>
        apiFetch<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        }),

    patch: <T = any>(endpoint: string, data?: any) =>
        apiFetch<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        }),

    delete: <T = any>(endpoint: string) =>
        apiFetch<T>(endpoint, { method: 'DELETE' }),

    // For file uploads
    upload: async <T = any>(endpoint: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${API_BASE_URL}${endpoint}`;
        const res = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new ApiError(body?.message || 'Upload failed', res.status);
        }

        return res.json() as Promise<T>;
    },
};

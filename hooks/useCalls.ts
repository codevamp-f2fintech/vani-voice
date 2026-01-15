import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Call } from '../lib/types';

interface UseCallsOptions {
    page?: number;
    search?: string;
    status?: string;
    from?: string;
    to?: string;
    limit?: number;
}

export function useCalls(options: UseCallsOptions = {}) {
    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCalls = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (options.page) params.set('page', String(options.page));
            if (options.search) params.set('q', options.search);
            if (options.status) params.set('status', options.status);
            if (options.from) params.set('from', options.from);
            if (options.to) params.set('to', options.to);
            if (options.limit) params.set('limit', String(options.limit));

            const queryString = params.toString();
            const endpoint = `/calls/list${queryString ? `?${queryString}` : ''}`;
            const data = await api.get<Call[]>(endpoint);
            setCalls(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load calls');
        } finally {
            setLoading(false);
        }
    }, [options.page, options.search, options.status, options.from, options.to, options.limit]);

    useEffect(() => {
        loadCalls();
    }, [loadCalls]);

    return { calls, loading, error, refetch: loadCalls };
}

export function useCall(id: string | null) {
    const [call, setCall] = useState<Call | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const loadCall = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await api.get<Call>(`/outbound-call-info/${id}`);
                setCall(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load call');
            } finally {
                setLoading(false);
            }
        };

        loadCall();
    }, [id]);

    return { call, loading, error };
}

export function formatDuration(startedAt?: string, endedAt?: string): string {
    if (!startedAt || !endedAt) return 'N/A';
    const duration = Math.max(
        0,
        Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000)
    );
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins}m ${secs}s`;
}

export function formatCost(cost?: number): string {
    if (typeof cost !== 'number') return '—';
    return `₹${(cost * 83).toFixed(2)}`;
}

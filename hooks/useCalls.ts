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
    const [totalCount, setTotalCount] = useState(0);
    const [totalDurationSeconds, setTotalDurationSeconds] = useState(0);
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
            const data = await api.get<any>(endpoint);

            // Handle both old array format and new paginated { calls, totalCount } format
            if (Array.isArray(data)) {
                setCalls(data);
                setTotalCount(data.length);
                setTotalDurationSeconds(0); // Not available in old format
            } else if (data && Array.isArray(data.calls)) {
                setCalls(data.calls);
                setTotalCount(data.totalCount || data.calls.length);
                setTotalDurationSeconds(data.totalDurationSeconds || 0);
            } else {
                setCalls([]);
                setTotalCount(0);
                setTotalDurationSeconds(0);
            }
        } catch (err: any) {
            console.error('Error loading calls:', err);
            setError(err.message || 'Failed to load calls');
            setCalls([]);
            setTotalCount(0);
            setTotalDurationSeconds(0);
        } finally {
            setLoading(false);
        }
    }, [options.page, options.search, options.status, options.from, options.to, options.limit]);

    useEffect(() => {
        loadCalls();
    }, [loadCalls]);

    const deleteCalls = async (ids: string[]) => {
        setLoading(true);
        try {
            await api.post('/calls/bulk-delete', { ids });
            await loadCalls();
            return { success: true };
        } catch (err: any) {
            console.error('Error deleting calls:', err);
            setError(err.message || 'Failed to delete calls');
            setLoading(false);
            return { success: false, error: err.message };
        }
    };

    return { calls, totalCount, totalDurationSeconds, loading, error, refetch: loadCalls, deleteCalls };
}

export function useLeads(options: { agentId?: string } = {}) {
    const [leads, setLeads] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLeads = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (options.agentId) params.set('agentId', options.agentId);

            const queryString = params.toString();
            const endpoint = `/leads/list${queryString ? `?${queryString}` : ''}`;
            const data = await api.get<Call[]>(endpoint);
            setLeads(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Error loading leads:', err);
            setError(err.message || 'Failed to load leads');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    }, [options.agentId]);

    useEffect(() => {
        loadLeads();
    }, [loadLeads]);

    return { leads, loading, error, refetch: loadLeads };
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

export function formatDurationSeconds(duration?: number): string {
    if (typeof duration !== 'number' || duration < 0) return '0m 0s';
    
    // Add logic to show hours if duration is large enough
    const hours = Math.floor(duration / 3600);
    const mins = Math.floor((duration % 3600) / 60);
    const secs = Math.floor(duration % 60);
    
    if (hours > 0) {
        return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
}

export function formatCost(cost?: number): string {
    if (typeof cost !== 'number') return '—';
    return `₹${(cost * 83).toFixed(2)}`;
}

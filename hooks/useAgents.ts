import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Agent, AgentListResponse, AgentResponse, AgentStatsResponse } from '../lib/types';

export function useAgents(search?: string) {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAgents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            const queryString = params.toString();
            const endpoint = `/vapi/agents${queryString ? `?${queryString}` : ''}`;
            const data = await api.get<AgentListResponse>(endpoint);
            if (data.success) {
                setAgents(data.data);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load agents');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        loadAgents();
    }, [loadAgents]);

    return { agents, loading, error, refetch: loadAgents };
}

export function useAgent(id: string | null) {
    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const loadAgent = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await api.get<AgentResponse>(`/vapi/agents/${id}`);
                if (data.success) {
                    setAgent(data.agent);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load agent');
            } finally {
                setLoading(false);
            }
        };

        loadAgent();
    }, [id]);

    return { agent, loading, error };
}

export function useAgentStats() {
    const [stats, setStats] = useState<AgentStatsResponse['stats'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadStats = async () => {
            try {
                setLoading(true);
                const data = await api.get<AgentStatsResponse>('/vapi/agents/stats/overview');
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load stats');
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    return { stats, loading, error };
}

export async function createAgent(config: any): Promise<AgentResponse> {
    return api.post<AgentResponse>('/vapi/agents', config);
}

export async function updateAgent(id: string, updates: any): Promise<AgentResponse> {
    return api.patch<AgentResponse>(`/vapi/agents/${id}`, updates);
}

export async function deleteAgent(id: string): Promise<{ success: boolean; message: string }> {
    return api.delete(`/vapi/agents/${id}`);
}

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Voice, VoiceListResponse } from '../lib/types';

export function useVoices() {
    const [voices, setVoices] = useState<Voice[]>([]);
    const [providers, setProviders] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadVoices = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await api.get<VoiceListResponse>('/vapi/voices');
                if (data.success) {
                    setVoices(data.voices);
                    setProviders(data.providers || []);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load voices');
            } finally {
                setLoading(false);
            }
        };

        loadVoices();
    }, []);

    return { voices, providers, loading, error };
}

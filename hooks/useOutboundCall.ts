import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function useOutboundCall() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const makeCall = async (to: string, agentId?: string) => {
        try {
            setLoading(true);
            setError(null);
            const result = await api.post('/outbound-call', {
                to,
                agentId: agentId && agentId !== 'default' ? agentId : undefined
            });
            return result;
        } catch (err: any) {
            setError(err.message || 'Failed to initiate call');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { makeCall, loading, error };
}

// E.164 phone number validation
export function validateE164(phone: string): boolean {
    // Must start with + and contain 8-15 digits
    return /^\+[1-9]\d{7,14}$/.test(phone.replace(/\s/g, ''));
}

// Parse numbers from CSV text
export function parseNumbersFromCSV(text: string): string[] {
    return text
        .split(/[\n,;]/g)
        .map((s) => s.trim())
        .filter(Boolean);
}

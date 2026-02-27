// Hook for Independent Calls (No VAPI dependency)
// Replaces VAPI call functionality with our own voice pipeline

import { useState, useCallback } from 'react';
import { api } from '../lib/api';

export interface IndependentCall {
    sid: string;
    to: string;
    from: string;
    status: string;
    agentName?: string;
    duration?: number;
    transcript?: string;
    recordingUrl?: string;
    createdAt?: string;
    endedAt?: string;
}

export interface IndependentCallResponse {
    success: boolean;
    call: IndependentCall;
}

export function useIndependentCall() {
    const [calling, setCalling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeCall, setActiveCall] = useState<IndependentCall | null>(null);

    /**
     * Make an outbound call using independent voice pipeline
     */
    const makeCall = useCallback(async (to: string, agentId: string, variables?: Record<string, string>) => {
        try {
            setCalling(true);
            setError(null);

            const body: any = { to, agentId };
            if (variables && Object.keys(variables).length > 0) {
                body.variables = variables;
            }

            const response = await api.post<IndependentCallResponse>(
                '/api/independent-calls/outbound',
                body
            );

            if (response.success) {
                setActiveCall(response.call);
                return response.call;
            } else {
                throw new Error('Failed to make call');
            }
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to initiate call';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setCalling(false);
        }
    }, []);

    /**
     * Get call details
     */
    const getCallDetails = useCallback(async (callId: string) => {
        try {
            const response = await api.get<IndependentCallResponse>(
                `/api/independent-calls/${callId}`
            );

            if (response.success) {
                setActiveCall(response.call);
                return response.call;
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch call details');
            throw err;
        }
    }, []);

    /**
     * End an active call
     */
    const endCall = useCallback(async (callId: string) => {
        try {
            const response = await api.post<{ success: boolean; message: string }>(
                `/api/independent-calls/${callId}/end`,
                {}
            );

            if (response.success) {
                setActiveCall(null);
                return true;
            }
            return false;
        } catch (err: any) {
            setError(err.message || 'Failed to end call');
            throw err;
        }
    }, []);

    /**
     * Reset state
     */
    const reset = useCallback(() => {
        setActiveCall(null);
        setError(null);
        setCalling(false);
    }, []);

    return {
        makeCall,
        getCallDetails,
        endCall,
        reset,
        calling,
        error,
        activeCall
    };
}

/**
 * Hook for managing call list
 */
export function useIndependentCalls() {
    const [calls, setCalls] = useState<IndependentCall[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadCalls = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Use existing call list endpoint (already filtered by user)
            const response = await api.get<{ success: boolean; calls: IndependentCall[] }>(
                '/calls/list'
            );

            if (Array.isArray(response)) {
                setCalls(response);
            } else {
                setCalls([]);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load calls');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        calls,
        loading,
        error,
        loadCalls
    };
}

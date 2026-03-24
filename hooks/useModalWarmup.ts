// useModalWarmup — Modal/Chatterbox TTS warm-up hook
// Usage: const { needsWarmup, isWarmedUp, isWarming, warmupError, warmup } = useModalWarmup(agent);
// - needsWarmup: true only when agent uses chatterbox TTS
// - isWarmedUp:  true after a successful warm-up call
// - isWarming:   true while the warm-up request is in-flight
// - warmupError: string or null — last error message
// - warmup():    trigger the warm-up — resolves on success, resolves on failure (error stored in warmupError)

import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../lib/api';

/** Check if an agent uses Chatterbox (Modal) as its TTS provider */
export function isChatterboxAgent(agent: any): boolean {
    return (
        agent?.configuration?.voice?.provider?.toLowerCase() === 'chatterbox'
    );
}

export interface WarmupResult {
    success: boolean;
    warmedUp?: boolean;
    responseTimeMs?: number;
    message?: string;
    error?: string;
}

export function useModalWarmup(agent: any | null) {
    const needsWarmup = isChatterboxAgent(agent);

    const [isWarmedUp, setIsWarmedUp] = useState(false);
    const [isWarming, setIsWarming] = useState(false);
    const [warmupError, setWarmupError] = useState<string | null>(null);
    const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);

    // Reset state when the agent changes (different agent selected)
    const agentId = agent?._id;
    const prevAgentId = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (prevAgentId.current !== agentId) {
            prevAgentId.current = agentId;
            setIsWarmedUp(false);
            setIsWarming(false);
            setWarmupError(null);
            setResponseTimeMs(null);
        }
    }, [agentId]);

    const warmup = useCallback(async () => {
        if (!needsWarmup || isWarming) return;

        setIsWarming(true);
        setWarmupError(null);
        setIsWarmedUp(false);

        try {
            // Optionally pass the agent's voice_key so Modal warms up the right voice
            const voiceKey = agent?.configuration?.voice?.voiceId
                || agent?.configuration?.voice?.voice
                || 'voices/system/default.wav';

            const result = await api.post<WarmupResult>('/vapi/voices/chatterbox/warmup', {
                voice_key: voiceKey,
            });

            if (result.success && result.warmedUp) {
                setIsWarmedUp(true);
                setResponseTimeMs(result.responseTimeMs ?? null);
            } else {
                setWarmupError(result.error || 'Warm-up did not complete successfully');
            }
        } catch (err: any) {
            setWarmupError(err.message || 'Failed to warm up Modal');
        } finally {
            setIsWarming(false);
        }
    }, [needsWarmup, isWarming, agent]);

    return {
        needsWarmup,
        isWarmedUp,
        isWarming,
        warmupError,
        responseTimeMs,
        warmup,
    };
}

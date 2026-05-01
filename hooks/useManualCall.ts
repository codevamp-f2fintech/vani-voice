// useManualCall.ts
// Manages a full manual (human) call via SIP trunk:
//   1. POST /api/manual-calls/start   → get internalCallId
//   2. Open WebSocket /ws/manual-call → send init + JWT
//   3. Capture mic → resample to 8kHz → μ-law encode → WS binary
//   4. Receive WS binary (μ-law from PSTN) → decode → play via AudioContext
//   5. POST /api/manual-calls/end  OR  WS "end" frame to hang up

import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../lib/api';
import { API_BASE_URL } from '../lib/config';

// ─── Types ───────────────────────────────────────────────────────────────────
export type CallStatus =
  | 'idle'
  | 'connecting'   // HTTP start sent, waiting for SIP 200 OK
  | 'live'         // WS initialized, audio flowing
  | 'ending'       // hang-up in progress
  | 'ended';       // call finished

export interface ManualCallState {
  status: CallStatus;
  internalCallId: string | null;
  toNumber: string | null;
  duration: number;          // seconds since call went live
  isMuted: boolean;
  error: string | null;
}

export interface UseManualCallReturn extends ManualCallState {
  startCall: (to: string, agentId: string) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  clearError: () => void;
}

// ─── μ-law encode/decode (ITU-T G.711) ───────────────────────────────────────
function encodeMuLaw(sample: number): number {
  const MU = 255;
  const BIAS = 33;
  const sign = sample < 0 ? 0x80 : 0;
  if (sample < 0) sample = -sample;
  sample = Math.min(sample, 32767);
  sample += BIAS;
  const magnitude = Math.log(1 + MU * sample / 32767) / Math.log(1 + MU);
  const compressed = Math.min(Math.floor(magnitude * 128), 127);
  return ~(sign | compressed) & 0xFF;
}

function decodeMuLaw(ulaw: number): number {
  ulaw = ~ulaw & 0xFF;
  const sign = ulaw & 0x80 ? -1 : 1;
  const exponent = (ulaw >> 4) & 0x07;
  const mantissa = ulaw & 0x0F;
  const magnitude = ((mantissa << 1) | 1) << (exponent + 2);
  return sign * (magnitude - 33);
}

// Resample float32 PCM from srcRate → 8000 Hz, return Int16Array
function resampleTo8k(input: Float32Array, srcRate: number): Int16Array {
  const ratio = srcRate / 8000;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Int16Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIdx = i * ratio;
    const lo = Math.floor(srcIdx);
    const hi = Math.min(lo + 1, input.length - 1);
    const frac = srcIdx - lo;
    const sample = input[lo] * (1 - frac) + input[hi] * frac;
    output[i] = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
  }
  return output;
}

// Encode Int16Array → Uint8Array μ-law
function encodeToMuLaw(pcm16: Int16Array): Uint8Array {
  const out = new Uint8Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    out[i] = encodeMuLaw(pcm16[i]);
  }
  return out;
}

// Decode Uint8Array μ-law → Float32Array (normalized -1..1)
function decodeMuLawToFloat32(ulaw: Uint8Array): Float32Array {
  const out = new Float32Array(ulaw.length);
  for (let i = 0; i < ulaw.length; i++) {
    out[i] = decodeMuLaw(ulaw[i]) / 32768;
  }
  return out;
}

// Derive WS URL from HTTP API base URL
function getWsUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  return base.replace(/^http/, 'ws') + path;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useManualCall(): UseManualCallReturn {
  const [state, setState] = useState<ManualCallState>({
    status: 'idle',
    internalCallId: null,
    toNumber: null,
    duration: 0,
    isMuted: false,
    error: null,
  });

  // Refs (not in state to avoid re-renders)
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMutedRef = useRef(false);
  const statusRef = useRef<CallStatus>('idle'); // tracks live status without stale closure
  const nextPlayTimeRef = useRef<number>(0);     // jitter buffer scheduling
  const accumulatorRef = useRef<Uint8Array[]>([]); // batch incoming audio chunks

  // Clean up all audio resources
  const cleanupAudio = useCallback(() => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current.onaudioprocess = null;
      scriptProcessorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Reset playback state
    nextPlayTimeRef.current = 0;
    accumulatorRef.current = [];
  }, []);

  // Clean up WebSocket
  const cleanupWs = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }, []);

  // Full teardown
  const teardown = useCallback((reason?: string) => {
    cleanupAudio();
    cleanupWs();
    setState(prev => ({
      ...prev,
      status: 'ended',
      error: reason || null,
    }));
  }, [cleanupAudio, cleanupWs]);

  // Play incoming μ-law audio buffer through speakers with batched scheduling
  // Accumulates BATCH_SIZE packets (each 20ms) before scheduling to reduce
  // AudioBufferSource creation from 50/s to 10/s, eliminating browser throttling.
  const BATCH_SIZE = 5; // 5 x 20ms = 100ms per scheduled buffer
  const playAudioBuffer = useCallback((muLawBytes: Uint8Array) => {
    if (muLawBytes.length === 0) return;
    accumulatorRef.current.push(muLawBytes);

    // Wait until we have a full batch
    if (accumulatorRef.current.length < BATCH_SIZE) return;

    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state === 'closed') {
      accumulatorRef.current = [];
      return;
    }

    // Concatenate all buffered μ-law packets into one contiguous chunk
    const totalLen = accumulatorRef.current.reduce((s, b) => s + b.length, 0);
    const combined = new Uint8Array(totalLen);
    let offset = 0;
    for (const buf of accumulatorRef.current) {
      combined.set(buf, offset);
      offset += buf.length;
    }
    accumulatorRef.current = [];

    // Decode entire batch at once
    const pcmFloat = decodeMuLawToFloat32(combined);
    const buffer = ctx.createBuffer(1, pcmFloat.length, 8000);
    buffer.copyToChannel(pcmFloat, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    // Schedule smoothly using the jitter buffer clock
    const currentTime = ctx.currentTime;
    let playTime = nextPlayTimeRef.current;
    if (playTime < currentTime || playTime > currentTime + 2.0) {
      // Fell too far behind or ahead — resync with a small lead
      playTime = currentTime + 0.08;
    }
    source.start(playTime);
    nextPlayTimeRef.current = playTime + buffer.duration;
  }, []);

  // Set up microphone capture and send audio to WebSocket
  const setupMic = useCallback(async (ws: WebSocket, srcRate: number) => {
    const stream = micStreamRef.current;
    const ctx = audioCtxRef.current;
    if (!stream || !ctx) return;

    const source = ctx.createMediaStreamSource(stream);
    // ScriptProcessorNode works across all browsers (AudioWorklet more complex for this use-case)
    const bufferSize = 4096;
    const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
    scriptProcessorRef.current = processor;

    processor.onaudioprocess = (event) => {
      if (isMutedRef.current) return;
      if (ws.readyState !== WebSocket.OPEN) return;

      const float32 = event.inputBuffer.getChannelData(0);
      const pcm16 = resampleTo8k(float32, srcRate);
      const mulaw = encodeToMuLaw(pcm16);
      ws.send(mulaw.buffer);
    };

    source.connect(processor);
    processor.connect(ctx.destination); // must connect to keep alive (silent output node)
  }, []);

  // ─── startCall ──────────────────────────────────────────────────────────────
  const startCall = useCallback(async (to: string, agentId: string) => {
    if (state.status !== 'idle' && state.status !== 'ended') return;

    setState(prev => ({ ...prev, status: 'connecting', error: null, toNumber: to, duration: 0 }));
    statusRef.current = 'connecting';

    try {
      // 1. HTTP: Start the SIP call on server
      const response = await api.post<{
        success: boolean;
        internalCallId: string;
        sipCallId: string;
        to: string;
        message?: string;
      }>('/api/manual-calls/start', { to, agentId });

      if (!response.success) {
        throw new Error(response.message || 'Failed to start call');
      }

      const { internalCallId } = response;

      // 2. Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = stream;

      // 3. Create AudioContext
      const ctx = new AudioContext({ sampleRate: 48000 });
      audioCtxRef.current = ctx;
      // Resume context (Chrome requires user gesture)
      if (ctx.state === 'suspended') await ctx.resume();

      // 4. Open WebSocket
      const wsUrl = getWsUrl('/ws/manual-call');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.binaryType = 'arraybuffer';

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => {
          // 5. Send init frame with JWT token
          const token = localStorage.getItem('vani_access_token') || '';
          ws.send(JSON.stringify({ event: 'init', internalCallId, token }));
        };

        ws.onmessage = (event) => {
          if (typeof event.data === 'string') {
            try {
              const msg = JSON.parse(event.data);

              if (msg.event === 'initialized') {
                // WS fully initialized — now we're live
                setState(prev => ({ ...prev, status: 'live', internalCallId }));
                statusRef.current = 'live';

                // Start duration timer
                timerRef.current = setInterval(() => {
                  setState(prev => ({ ...prev, duration: prev.duration + 1 }));
                }, 1000);

                // Start mic → WS audio pipe
                setupMic(ws, ctx.sampleRate);

                resolve();
                return;
              }

              if (msg.event === 'call_ended') {
                teardown();
                return;
              }

              if (msg.event === 'error') {
                reject(new Error(msg.error || 'WebSocket error'));
                return;
              }
            } catch {
              // not JSON, ignore
            }
          } else {
            // Binary: incoming audio from remote party (μ-law)
            const muLawBytes = new Uint8Array(event.data as ArrayBuffer);
            if (muLawBytes.length === 0) return;
            
            // Randomly log first few to confirm WS receipt
            if (!wsRef.current?.binaryCount) {
              (wsRef.current as any).binaryCount = 1;
            } else {
              (wsRef.current as any).binaryCount++;
            }
            if ((wsRef.current as any).binaryCount % 100 === 1) {
               console.log(`[WS Debug] Received binary packet #${(wsRef.current as any).binaryCount}, size: ${muLawBytes.length}`);
            }
            
            playAudioBuffer(muLawBytes);
          }
        };

        ws.onerror = () => reject(new Error('WebSocket connection failed'));

        ws.onclose = () => {
          // Only treat as unexpected if call was live (avoid triggering during setup)
          if (statusRef.current === 'live') {
            teardown('Connection lost');
          }
        };

        // Timeout if server doesn't respond to init
        setTimeout(() => reject(new Error('Call setup timed out after 30s')), 30000);
      });

    } catch (err: any) {
      cleanupAudio();
      cleanupWs();
      setState(prev => ({
        ...prev,
        status: 'ended',
        error: err.message || 'Failed to start call',
      }));
    }
  }, [state.status, cleanupAudio, cleanupWs, playAudioBuffer, setupMic, teardown]);

  // ─── endCall ────────────────────────────────────────────────────────────────
  const endCall = useCallback(async () => {
    if (state.status === 'idle' || state.status === 'ending' || state.status === 'ended') return;

    setState(prev => ({ ...prev, status: 'ending' }));

    const { internalCallId } = state;

    // Signal server via WS (fast path)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ event: 'end' }));
      } catch { /* ignore */ }
    }

    // Also HTTP hangup (belt + suspenders)
    if (internalCallId) {
      try {
        await api.post('/api/manual-calls/end', { internalCallId });
      } catch { /* ignore */ }
    }

    teardown();
  }, [state, teardown]);

  // ─── toggleMute ─────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    // Also mute/unmute the underlying media tracks for visual indicator
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !isMutedRef.current;
      });
    }
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
      cleanupWs();
    };
  }, [cleanupAudio, cleanupWs]);

  return {
    ...state,
    startCall,
    endCall,
    toggleMute,
    clearError,
  };
}

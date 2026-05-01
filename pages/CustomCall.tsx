// CustomCall.tsx
// Human Dialer — lets a user make a live SIP call from the browser
// Audio goes: Browser Mic → WebSocket → SipTrunkService → PSTN
//             PSTN → SipTrunkService → WebSocket → Browser Speakers

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/UI';
import {
  Phone, PhoneOff, Mic, MicOff, Users, Loader2,
  PhoneCall, CheckCircle, AlertTriangle, Clock,
  Headphones, Radio, Wifi, WifiOff
} from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import { useManualCall, CallStatus } from '../hooks/useManualCall';

// ─── E.164 validation ─────────────────────────────────────────────────────────
function validateE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone.trim());
}

// ─── Duration formatter ───────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Animated waveform bars (shown while call is live) ────────────────────────
const AudioWave: React.FC<{ active: boolean }> = ({ active }) => (
  <div className="flex items-end justify-center gap-[3px] h-8">
    {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
      <div
        key={i}
        className={`w-1 rounded-full transition-all ${active ? 'bg-emerald-400' : 'bg-white/20'
          }`}
        style={{
          height: active ? `${h * 4 + 4}px` : '4px',
          animationDelay: `${i * 80}ms`,
          animation: active ? 'wave 1s ease-in-out infinite alternate' : 'none',
        }}
      />
    ))}
    <style>{`
      @keyframes wave {
        0%   { transform: scaleY(0.4); }
        100% { transform: scaleY(1.0); }
      }
    `}</style>
  </div>
);

// ─── Status badge ─────────────────────────────────────────────────────────────
const statusConfig: Record<CallStatus, { label: string; color: string; icon: React.ReactNode }> = {
  idle: { label: 'Ready', color: 'text-gray-400', icon: <Radio size={14} /> },
  connecting: { label: 'Connecting', color: 'text-yellow-400', icon: <Wifi size={14} className="animate-pulse" /> },
  live: { label: 'Live', color: 'text-emerald-400', icon: <Headphones size={14} /> },
  ending: { label: 'Ending', color: 'text-orange-400', icon: <Loader2 size={14} className="animate-spin" /> },
  ended: { label: 'Ended', color: 'text-gray-400', icon: <WifiOff size={14} /> },
};

// ─── Main Component ────────────────────────────────────────────────────────────
const CustomCall: React.FC = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [agentError, setAgentError] = useState('');
  const hasRedirected = useRef(false);

  const { agents, loading: agentsLoading } = useAgents();
  const {
    status, duration, isMuted, error,
    startCall, endCall, toggleMute, clearError,
  } = useManualCall();

  const activeAgents = useMemo(() => agents.filter(a => a.status === 'active'), [agents]);
  const isLive = status === 'live';
  const isConnecting = status === 'connecting' || status === 'ending';
  const hasEnded = status === 'ended';

  // Auto-redirect to call logs after call ends (single call use-case)
  // useEffect(() => {
  //   if (hasEnded && !hasRedirected.current) {
  //     hasRedirected.current = true;
  //     const timer = setTimeout(() => navigate('/call-logs'), 2500);
  //     return () => clearTimeout(timer);
  //   }
  // }, [hasEnded, navigate]);

  // Reset redirect flag when status goes back to idle
  useEffect(() => {
    if (status === 'idle') hasRedirected.current = false;
  }, [status]);

  const handleStart = async () => {
    let valid = true;
    if (!validateE164(phoneNumber)) {
      setPhoneError('Enter a valid E.164 number, e.g. +918267818161');
      valid = false;
    } else {
      setPhoneError('');
    }
    if (!selectedAgentId) {
      setAgentError('Please select an agent');
      valid = false;
    } else {
      setAgentError('');
    }
    if (!valid) return;

    hasRedirected.current = false;
    await startCall(phoneNumber.trim(), selectedAgentId);
  };

  const handleEnd = async () => {
    await endCall();
  };

  // ─── LIVE / CALLING UI ────────────────────────────────────────────────────
  if (isLive || isConnecting || hasEnded) {
    return (
      <div className="max-w-md mx-auto space-y-6 pt-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-black dark:text-white tracking-tight mb-1">Custom Call</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Live human dialer via SIP trunk</p>
        </div>

        {/* Main Call Card */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-white/10 bg-gradient-to-br from-[#1a0a2e] via-[#110820] to-[#0d0d1a] shadow-2xl shadow-violet-900/30 p-8">

          {/* Animated background glow */}
          {isLive && (
            <>
              <div className="absolute inset-0 rounded-3xl bg-emerald-500/5 animate-pulse" />
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl" />
            </>
          )}

          <div className="relative z-10 flex flex-col items-center gap-6">

            {/* Status badge */}
            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/5 ${statusConfig[status].color}`}>
              {statusConfig[status].icon}
              {statusConfig[status].label}
            </div>

            {/* Avatar ring */}
            <div className={`relative flex items-center justify-center w-28 h-28 rounded-full ${isLive
                ? 'bg-emerald-500/20 ring-4 ring-emerald-500/40 ring-offset-4 ring-offset-[#110820]'
                : isConnecting
                  ? 'bg-yellow-500/20 ring-4 ring-yellow-500/30 ring-offset-4 ring-offset-[#110820]'
                  : 'bg-white/5 ring-4 ring-white/10 ring-offset-4 ring-offset-[#110820]'
              }`}>
              {isConnecting ? (
                <Loader2 size={44} className="text-yellow-400 animate-spin" />
              ) : isLive ? (
                <PhoneCall size={44} className="text-emerald-400" />
              ) : (
                <PhoneOff size={44} className="text-gray-400" />
              )}

              {/* Ripple rings when live */}
              {isLive && (
                <>
                  <span className="absolute inset-0 rounded-full ring-2 ring-emerald-400/30 animate-ping" />
                  <span className="absolute inset-[-12px] rounded-full ring-1 ring-emerald-400/15 animate-ping" style={{ animationDelay: '300ms' }} />
                </>
              )}
            </div>

            {/* Phone number */}
            <div className="text-center">
              <p className="text-2xl font-black text-white tracking-wider">{phoneNumber}</p>
              <p className="text-xs text-gray-500 mt-1">
                {isLive ? 'In conversation' : isConnecting ? 'Dialing...' : 'Call ended'}
              </p>
            </div>

            {/* Duration */}
            {isLive && (
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xl font-bold">
                <Clock size={16} />
                {formatDuration(duration)}
              </div>
            )}

            {/* Audio wave */}
            <AudioWave active={isLive && !isMuted} />

            {/* Call ended message */}
            {hasEnded && !error && (
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <CheckCircle size={16} className="text-emerald-400" />
                Call ended — redirecting to logs…
              </div>
            )}

            {/* Error in live view */}
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 w-full">
                <AlertTriangle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Call Controls */}
            {(isLive || isConnecting) && (
              <div className="flex items-center gap-6 mt-2">
                {/* Mute */}
                <button
                  id="mute-toggle-btn"
                  onClick={toggleMute}
                  disabled={!isLive}
                  className={`flex flex-col items-center gap-2 group transition-all ${!isLive ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted
                      ? 'bg-red-500/20 border-2 border-red-500/50 text-red-400'
                      : 'bg-white/10 border-2 border-white/20 text-white hover:bg-white/20'
                    }`}>
                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>

                {/* End Call */}
                <button
                  id="end-call-btn"
                  onClick={handleEnd}
                  disabled={status === 'ending'}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 border-2 border-red-400/50 flex items-center justify-center text-white transition-all hover:scale-105 shadow-lg shadow-red-600/40 active:scale-95">
                    {status === 'ending' ? (
                      <Loader2 size={26} className="animate-spin" />
                    ) : (
                      <PhoneOff size={26} />
                    )}
                  </div>
                  <span className="text-[11px] text-red-400 font-medium">End Call</span>
                </button>
              </div>
            )}

            {/* Go to logs button when ended */}
            {hasEnded && (
              <button
                onClick={() => navigate('/call-logs')}
                className="mt-2 px-6 py-2.5 rounded-xl bg-vani-plum text-white text-sm font-bold hover:bg-vani-plum/80 transition-all"
              >
                Go to Call Logs
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── IDLE / SETUP UI ──────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto space-y-6 pt-4">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-4xl font-black dark:text-white tracking-tight">Custom Call</h1>
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-vani-plum/20 text-vani-pink border border-vani-plum/30">
            Human Dialer
          </span>
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          Call any number live from your browser — your voice goes directly over SIP.
        </p>
      </div>

      {/* Global error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Call Failed</p>
            <p className="mt-0.5 opacity-80">{error}</p>
          </div>
          <button onClick={clearError} className="text-red-400/60 hover:text-red-400 transition-colors">✕</button>
        </div>
      )}

      {/* Form Card */}
      <Card className="p-8 border-2 dark:border-white/10">
        <div className="space-y-6">

          {/* Phone Number */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold dark:text-gray-200">
              <Phone size={16} className="text-vani-plum" />
              Phone Number
            </label>
            <input
              id="custom-call-phone"
              type="tel"
              placeholder="+91XXXXXXXXXX"
              value={phoneNumber}
              onChange={e => { setPhoneNumber(e.target.value); setPhoneError(''); }}
              className={`w-full h-14 px-4 bg-gray-50 dark:bg-white/5 border-2 rounded-xl text-lg font-medium dark:text-white outline-none transition-all ${phoneError
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-gray-100 dark:border-white/10 focus:border-vani-plum'
                }`}
            />
            {phoneError ? (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle size={11} /> {phoneError}
              </p>
            ) : (
              <p className="text-xs text-gray-400">E.164 format required — e.g. +918267818161</p>
            )}
          </div>

          {/* Agent Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold dark:text-gray-200">
              <Users size={16} className="text-vani-plum" />
              Agent (SIP Phone Number)
            </label>
            {agentsLoading ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm h-14 px-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                <Loader2 size={16} className="animate-spin" />
                Loading agents…
              </div>
            ) : activeAgents.length === 0 ? (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-yellow-700 dark:text-yellow-400 text-sm">
                No active agents. Agents need a SIP Trunk phone number configured.
              </div>
            ) : (
              <select
                id="custom-call-agent"
                value={selectedAgentId}
                onChange={e => { setSelectedAgentId(e.target.value); setAgentError(''); }}
                className={`w-full h-14 px-4 bg-gray-50 dark:bg-white/5 border-2 rounded-xl text-base dark:text-white outline-none transition-all font-medium ${agentError
                    ? 'border-red-500'
                    : 'border-gray-100 dark:border-white/10 focus:border-vani-plum'
                  }`}
              >
                <option value="">— Select Agent —</option>
                {activeAgents.map(agent => (
                  <option key={agent._id} value={agent._id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            )}
            {agentError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle size={11} /> {agentError}
              </p>
            )}
            <p className="text-xs text-gray-400">
              The agent's SIP trunk phone number is used to make the outbound call.
            </p>
          </div>

          {/* How it works note */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-vani-plum/5 border border-vani-plum/15">
            <Headphones size={16} className="text-vani-plum shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your browser mic and speakers connect directly to the phone call.
              Make sure headphones are plugged in to avoid echo.
            </p>
          </div>

          {/* Start Button */}
          <button
            id="start-custom-call-btn"
            onClick={handleStart}
            disabled={activeAgents.length === 0 || agentsLoading}
            className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl text-base font-black text-white bg-gradient-to-r from-vani-plum to-vani-pink shadow-lg shadow-vani-plum/30 hover:shadow-xl hover:shadow-vani-plum/40 hover:scale-[1.02] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <PhoneCall size={20} />
            Start Call
          </button>
        </div>
      </Card>

      {/* Tips */}
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            icon: <Mic size={18} className="text-vani-plum" />,
            title: 'Browser Mic',
            desc: 'Your microphone audio streams directly to the call in real-time.',
          },
          {
            icon: <Headphones size={18} className="text-vani-plum" />,
            title: 'Live Audio',
            desc: 'You hear the remote party through your browser speakers.',
          },
        ].map(tip => (
          <Card key={tip.title} className="p-5 border-2 dark:border-white/10">
            <div className="mb-2">{tip.icon}</div>
            <p className="text-sm font-bold dark:text-white mb-1">{tip.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{tip.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CustomCall;


import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Badge } from '../components/UI';
import {
    ArrowLeft,
    Phone,
    Clock,
    DollarSign,
    FileText,
    Play,
    Pause,
    Download,
    Loader2,
    MessageSquare,
    RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import type { Call } from '../lib/types';

const CallDetails: React.FC = () => {
    const navigate = useNavigate();
    const { callId } = useParams<{ callId: string }>();
    const [call, setCall] = useState<Call | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadCall = async () => {
        if (!callId) return;

        try {
            setLoading(true);
            setError(null);
            const response = await api.get<any>(`/outbound-call-info/${callId}`);
            setCall(response);
        } catch (err: any) {
            setError(err.message || 'Failed to load call details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCall();
    }, [callId]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadCall();
        setRefreshing(false);
    };

    const formatDuration = (startedAt?: string, endedAt?: string) => {
        if (!startedAt || !endedAt) return 'N/A';
        const seconds = Math.max(0, Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000));
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatCost = (cost?: number) => {
        if (typeof cost !== 'number' || cost <= 0) return '₹0.00';
        return `₹${(cost * 83).toFixed(2)}`;
    };

    const formatEndReason = (reason?: string) => {
        if (!reason) return '—';
        return reason
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const parseTranscript = (transcript?: string) => {
        if (!transcript) return [];

        // Try to parse as structured transcript
        const lines = transcript.split('\n').filter(l => l.trim());
        return lines.map(line => {
            const isUser = line.toLowerCase().startsWith('user:') || line.toLowerCase().startsWith('customer:');
            const isAI = line.toLowerCase().startsWith('ai:') || line.toLowerCase().startsWith('assistant:') || line.toLowerCase().startsWith('agent:');

            let speaker = 'unknown';
            let text = line;

            if (isUser) {
                speaker = 'user';
                text = line.replace(/^(user|customer):\s*/i, '');
            } else if (isAI) {
                speaker = 'ai';
                text = line.replace(/^(ai|assistant|agent):\s*/i, '');
            }

            return { speaker, text };
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-vani-plum" />
            </div>
        );
    }

    if (error || !call) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => navigate('/call-logs')} className="text-gray-500">
                    <ArrowLeft size={18} className="mr-2" /> Back to Call Logs
                </Button>
                <Card className="p-12 text-center">
                    <p className="text-red-500">{error || 'Call not found'}</p>
                </Card>
            </div>
        );
    }

    const transcriptLines = parseTranscript(call.transcript);

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/call-logs')} className="text-gray-500 p-2">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black dark:text-white tracking-tight">Call Details</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
                            ID: {call._id}
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="gap-2"
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </Button>
            </div>

            {/* Overview + Summary Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Overview Card */}
                <Card className="p-6 border-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-vani-plum/10 flex items-center justify-center">
                            <Phone size={16} className="text-vani-plum" />
                        </div>
                        <h2 className="text-lg font-black dark:text-white">Overview</h2>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                            <span className="text-sm text-gray-500 font-medium">Phone</span>
                            <span className="font-bold dark:text-white font-mono">{call.customer?.number || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                            <span className="text-sm text-gray-500 font-medium">Status</span>
                            <Badge variant={call.status === 'ended' ? 'success' : 'warning'}>{call.status || 'Unknown'}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                            <span className="text-sm text-gray-500 font-medium">Start</span>
                            <span className="text-sm dark:text-white">{call.startedAt ? new Date(call.startedAt).toLocaleString() : 'Not started'}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                            <span className="text-sm text-gray-500 font-medium">End</span>
                            <span className="text-sm dark:text-white">{call.endedAt ? new Date(call.endedAt).toLocaleString() : '—'}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-vani-plum/5 border border-vani-plum/20">
                            <span className="text-sm text-gray-500 font-medium flex items-center gap-2">
                                <Clock size={14} /> Duration
                            </span>
                            <span className="font-black text-vani-plum">{formatDuration(call.startedAt, call.endedAt)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-vani-plum/5 border border-vani-plum/20">
                            <span className="text-sm text-gray-500 font-medium flex items-center gap-2">
                                <DollarSign size={14} /> Cost
                            </span>
                            <span className="font-black text-vani-plum">{formatCost(call.cost)}</span>
                        </div>
                        {call.endedReason && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                                <span className="text-sm text-gray-500 font-medium">End Reason</span>
                                <span className="text-xs font-medium dark:text-white">{formatEndReason(call.endedReason)}</span>
                            </div>
                        )}
                        {call.agentName && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                                <span className="text-sm text-gray-500 font-medium">Agent</span>
                                <span className="font-medium dark:text-white">{call.agentName}</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Summary Card */}
                <Card className="p-6 border-2">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-xl">📝</span>
                        <h2 className="text-lg font-black dark:text-white">Call Summary</h2>
                    </div>

                    {call.summary ? (
                        <div className="bg-vani-plum/5 border border-vani-plum/20 rounded-xl p-4">
                            <p className="text-sm dark:text-gray-300 leading-relaxed">{call.summary}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic text-center py-8">
                            {call.endedReason === 'customer-did-not-answer'
                                ? 'No summary available - customer did not answer the call.'
                                : 'No summary available.'}
                        </p>
                    )}
                </Card>
            </div>

            {/* Transcript Card */}
            <Card className="p-6 border-2">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-vani-plum/10 flex items-center justify-center">
                            <MessageSquare size={16} className="text-vani-plum" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black dark:text-white">Transcript</h2>
                            <p className="text-xs text-gray-500">
                                {call.transcript
                                    ? 'Conversation between AI and Customer'
                                    : call.endedReason === 'customer-did-not-answer'
                                        ? 'No transcript available - customer did not answer'
                                        : 'No transcript available'}
                            </p>
                        </div>
                    </div>
                    {call.transcript && (
                        <Button variant="ghost" size="sm" className="text-vani-plum">
                            <Download size={14} className="mr-2" /> Download
                        </Button>
                    )}
                </div>

                {call.transcript ? (
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 border border-gray-100 dark:border-white/10 max-h-96 overflow-y-auto space-y-4">
                        {transcriptLines.length > 0 ? (
                            transcriptLines.map((line, i) => (
                                <div
                                    key={i}
                                    className={`flex ${line.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-4 rounded-2xl ${line.speaker === 'user'
                                                ? 'bg-vani-plum text-white rounded-tr-none'
                                                : 'bg-white dark:bg-white/10 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-white/5'
                                            }`}
                                    >
                                        <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
                                            {line.speaker === 'user' ? 'Customer' : 'AI Agent'}
                                        </p>
                                        <p className="text-sm leading-relaxed">{line.text}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm dark:text-gray-300 whitespace-pre-wrap">{call.transcript}</p>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                        <MessageSquare size={32} className="mx-auto mb-3 text-gray-400" />
                        <p className="text-sm">No conversation recorded</p>
                    </div>
                )}
            </Card>

            {/* Recording Card */}
            {call.recordingUrl && (
                <Card className="p-6 border-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-vani-plum flex items-center justify-center">
                            <Play size={14} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black dark:text-white">Recording</h2>
                            <p className="text-xs text-gray-500">Listen to the call audio</p>
                        </div>
                    </div>

                    <div className="bg-gray-900 rounded-2xl p-6">
                        <audio controls className="w-full">
                            <source src={call.recordingUrl} type="audio/mpeg" />
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default CallDetails;

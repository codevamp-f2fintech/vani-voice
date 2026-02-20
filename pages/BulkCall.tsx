import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Label, Badge } from '../components/UI';
import {
    Upload,
    Phone,
    Loader2,
    Download,
    X,
    Check,
    AlertCircle,
    Play,
    Pause,
    FileText,
    Cloud,
    RefreshCw
} from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import { validateE164 } from '../hooks/useOutboundCall';
import { API_BASE_URL } from '../lib/config';
import { api } from '../lib/api';

type QueueResult = {
    to: string;
    name?: string;
    ok: boolean;
    id?: string;
    error?: string
};

type ParsedRow = {
    phone: string;
    name?: string;
    valid: boolean;
};

const BulkCall: React.FC = () => {
    const navigate = useNavigate();
    const [text, setText] = useState('');
    const [selectedAgentId, setSelectedAgentId] = useState('default');
    const [concurrency, setConcurrency] = useState(3);
    const [starting, setStarting] = useState(false);
    const [results, setResults] = useState<QueueResult[]>([]);

    // Agent selection state
    const [showElevenLabsAgents, setShowElevenLabsAgents] = useState(true);
    const [elevenLabsAgents, setElevenLabsAgents] = useState<any[]>([]);
    const [loadingElevenLabs, setLoadingElevenLabs] = useState(false);

    const abortRef = useRef<AbortController | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { agents, loading: agentsLoading } = useAgents();
    const activeAgents = agents.filter(a => a.status === 'active');

    // Fetch agents from ElevenLabs
    const fetchElevenLabsAgents = async () => {
        setLoadingElevenLabs(true);
        try {
            const result = await api.get<any>('/elevenlabs/agents/sync/from-elevenlabs');
            console.log('ElevenLabs sync result:', result);
            setElevenLabsAgents(result.data || []);
        } catch (error) {
            console.error('Error fetching ElevenLabs agents:', error);
            setElevenLabsAgents([]);
        } finally {
            setLoadingElevenLabs(false);
        }
    };

    // Auto-fetch ElevenLabs agents on mount
    useEffect(() => {
        fetchElevenLabsAgents();
    }, []);

    // Parse and validate numbers with potential names
    const parsed = useMemo(() => {
        const lines = text.split(/[\n;]/g).map(s => s.trim()).filter(Boolean);
        const parsedRows: ParsedRow[] = [];

        lines.forEach(line => {
            // Check if line looks like CSV (contains comma)
            if (line.includes(',')) {
                const parts = line.split(',').map(p => p.trim());
                // Simple heuristic: Phone is usually first or looks like a number
                // Name is usually second or doesn't look like a number

                let phone = '';
                let name = '';

                // Try to find which part is the phone number
                const phoneIndex = parts.findIndex(p => validateE164(p) || p.match(/^(\+|00)?[1-9]\d{7,14}$/));

                if (phoneIndex !== -1) {
                    phone = parts[phoneIndex];
                    // If phone found, assume other part is name
                    // If we have at least 2 parts, use the other one as name
                    if (parts.length > 1) {
                        // Use the part that isn't the phone
                        const nameParts = parts.filter((_, i) => i !== phoneIndex);
                        name = nameParts.join(' ').trim();
                    }
                } else {
                    // Fallback to existing logic if simple split fails or no clear phone
                    // Just take the first part as potentially the number
                    phone = parts[0];
                }

                parsedRows.push({
                    phone,
                    name,
                    valid: validateE164(phone)
                });

            } else {
                // Single column (just numbers)
                parsedRows.push({
                    phone: line,
                    valid: validateE164(line)
                });
            }
        });

        // Dedup by phone
        const dedupedMap = new Map<string, ParsedRow>();
        parsedRows.forEach(row => {
            if (row.valid) {
                dedupedMap.set(row.phone, row);
            } else {
                // Keep invalid ones for stats? Or just discard?
                // Let's key by invalid phone too to show errors
                dedupedMap.set(row.phone, row);
            }
        });

        const dedupedList = Array.from(dedupedMap.values());

        const valid = dedupedList.filter(x => x.valid);
        const invalid = dedupedList.filter(x => !x.valid);
        const withNames = valid.filter(x => !!x.name).length;

        return {
            countRaw: lines.length,
            countUnique: dedupedList.length,
            valid,
            invalid,
            withNames
        };
    }, [text]);

    const progress = useMemo(() => {
        if (!results.length || !parsed.valid.length) return 0;
        return Math.min(100, Math.round((results.length / parsed.valid.length) * 100));
    }, [results.length, parsed.valid.length]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const content = await file.text();

        // Basic CSV detection
        // If it starts with a header, skip it
        const lines = content.split('\n');
        let startIndex = 0;
        const firstLine = lines[0].toLowerCase();
        if (firstLine.includes('phone') || firstLine.includes('number') || firstLine.includes('mobile')) {
            startIndex = 1;
        }

        const data = lines.slice(startIndex).join('\n');
        setText(data);
    };

    async function startQueue() {
        if (parsed.valid.length === 0) {
            alert('No valid numbers to call. Please add at least one valid E.164 number.');
            // @ts-ignore
            return;
        }

        setStarting(true);
        setResults([]);
        const controller = new AbortController();
        abortRef.current = controller;

        const queue = [...parsed.valid];
        let idx = 0;

        async function worker() {
            while (true) {
                if (controller.signal.aborted) return;
                const i = idx++;
                if (i >= queue.length) return;
                const row = queue[i];
                const to = row.phone;

                try {
                    const payload: any = {
                        to,
                        agentId: selectedAgentId !== 'default' ? selectedAgentId : undefined
                    };

                    if (row.name) {
                        payload.variables = { name: row.name };
                    }

                    const res = await fetch(`${API_BASE_URL}/outbound-call`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            // Add auth token manually as we are using raw fetch here
                            'Authorization': `Bearer ${localStorage.getItem('vani_access_token')}`
                        },
                        body: JSON.stringify(payload),
                        signal: controller.signal,
                    });
                    const data = await res.json().catch(() => ({}));
                    const ok = res.ok;
                    setResults(prev => [...prev, {
                        to,
                        name: row.name,
                        ok,
                        id: data?.id,
                        error: ok ? undefined : data?.message || 'Failed'
                    }]);
                } catch (e: any) {
                    if (controller.signal.aborted) return;
                    setResults(prev => [...prev, { to, name: row.name, ok: false, error: e?.message || 'Error' }]);
                }
            }
        }

        const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
        await Promise.all(workers);
        setStarting(false);
    }

    function cancel() {
        abortRef.current?.abort();
        setStarting(false);
    }

    function downloadFailures() {
        const failed = results.filter(r => !r.ok);
        if (!failed.length) {
            alert('No failures to download. All calls were queued successfully!');
            return;
        }
        const csv = 'phone,name,error\n' + failed.map(f => `${f.to},"${f.name || ''}","${f.error || ''}"`).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bulk-call-failures.csv';
        a.click();
    }

    const succeeded = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-4xl font-black dark:text-white tracking-tight">Bulk Calls</h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                    Upload a CSV or paste phone numbers to call multiple contacts.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* File Upload */}
                    <Card className="p-6 border-2">
                        <div className="space-y-4">
                            <Label className="flex items-center gap-2">
                                <FileText size={18} className="text-vani-plum" />
                                Upload CSV File
                            </Label>
                            <div
                                className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-vani-plum/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                                <p className="text-sm font-medium dark:text-white">Click to upload CSV</p>
                                <p className="text-xs text-gray-500 mt-1">Supported format: Phone, Name (optional)</p>
                            </div>
                        </div>
                    </Card>

                    {/* Text Input */}
                    <Card className="p-6 border-2">
                        <div className="space-y-4">
                            <Label className="flex items-center gap-2">
                                <Phone size={18} className="text-vani-plum" />
                                Or Paste Data
                            </Label>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="+91XXXXXXXXXX, John Doe"
                                className="w-full h-40 px-4 py-3 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-xl text-sm font-mono dark:text-white outline-none focus:border-vani-plum resize-none"
                            />
                            <p className="text-xs text-gray-500">Separated by newlines. Format: Phone, Name (optional)</p>
                        </div>
                    </Card>

                    {/* Agent Selection */}
                    <Card className="p-6 border-2">
                        {/* Agent Source Toggle */}
                        <div className="flex items-center gap-3 p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                            <Cloud size={20} className="text-blue-600" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                                    {showElevenLabsAgents ? 'Cloud Agents' : 'Local Agents'}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowElevenLabsAgents(!showElevenLabsAgents)}
                            >
                                {showElevenLabsAgents ? 'Use Local' : 'Use Cloud'}
                            </Button>
                            {showElevenLabsAgents && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={fetchElevenLabsAgents}
                                    disabled={loadingElevenLabs}
                                >
                                    <RefreshCw size={16} className={loadingElevenLabs ? 'animate-spin' : ''} />
                                </Button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <Label>Select Agent for All Calls</Label>
                            {(agentsLoading || loadingElevenLabs) ? (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Loader2 size={16} className="animate-spin" />
                                    Loading agents...
                                </div>
                            ) : (
                                <select
                                    value={selectedAgentId}
                                    onChange={(e) => setSelectedAgentId(e.target.value)}
                                    className="w-full h-12 px-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-xl text-base dark:text-white outline-none focus:border-vani-plum font-medium"
                                >
                                    <option value="default">Default Agent</option>
                                    {showElevenLabsAgents ? (
                                        // Show ElevenLabs agents
                                        elevenLabsAgents.map(agent => (
                                            <option key={agent.agent_id} value={agent.agent_id}>
                                                🌐 {agent.name || 'Unnamed Agent'} (Cloud)
                                            </option>
                                        ))
                                    ) : (
                                        // Show local database agents
                                        activeAgents.map(agent => (
                                            <option key={agent._id} value={agent._id}>
                                                {agent.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Stats & Controls */}
                <div className="space-y-6">
                    {/* Parsed Stats */}
                    <Card className="p-6 border-2">
                        <h3 className="font-bold dark:text-white mb-4">Number Analysis</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Raw entries</span>
                                <span className="font-bold dark:text-white">{parsed.countRaw}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Unique</span>
                                <span className="font-bold dark:text-white">{parsed.countUnique}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Valid Phones</span>
                                <span className="font-bold text-green-500">{parsed.valid.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">With Names</span>
                                <span className="font-bold text-blue-500">{parsed.withNames}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Invalid</span>
                                <span className="font-bold text-red-500">{parsed.invalid.length}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Concurrency */}
                    <Card className="p-6 border-2">
                        <Label className="mb-3 block">Concurrency (1-10)</Label>
                        <Input
                            type="number"
                            min={1}
                            max={10}
                            value={concurrency}
                            onChange={(e) => setConcurrency(Math.max(1, Math.min(10, Number(e.target.value))))}
                            className="h-12"
                        />
                    </Card>

                    {/* Actions */}
                    <div className="space-y-3">
                        {starting ? (
                            <Button
                                variant="outline"
                                className="w-full h-12 border-red-500 text-red-500 hover:bg-red-50"
                                onClick={cancel}
                            >
                                <Pause size={18} className="mr-2" /> Cancel
                            </Button>
                        ) : (
                            <Button
                                className="w-full h-12 shadow-xl"
                                onClick={startQueue}
                                disabled={parsed.valid.length === 0}
                            >
                                <Play size={18} className="mr-2" /> Start Calls ({parsed.valid.length})
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="w-full h-12"
                            onClick={() => setText('')}
                            disabled={starting}
                        >
                            Clear All
                        </Button>
                    </div>
                </div>
            </div>

            {/* Progress Section */}
            {(starting || results.length > 0) && (
                <Card className="p-6 border-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold dark:text-white">Progress</h3>
                        <span className="text-sm text-gray-500">{progress}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mb-4">
                        <div
                            className="h-full vani-gradient transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-sm">Success: {succeeded}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-sm">Failed: {failed}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-300" />
                            <span className="text-sm">Pending: {parsed.valid.length - results.length}</span>
                        </div>
                    </div>

                    {/* Results Table */}
                    {results.length > 0 && (
                        <>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm text-gray-500">
                                    Completed {results.length} / {parsed.valid.length}
                                </span>
                                <Button variant="outline" size="sm" onClick={downloadFailures}>
                                    <Download size={14} className="mr-2" /> Download Failures
                                </Button>
                            </div>
                            <div className="max-h-64 overflow-auto rounded-xl border border-gray-100 dark:border-white/10">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-white/5 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-bold text-gray-500">Phone</th>
                                            <th className="px-4 py-3 text-left font-bold text-gray-500">Name</th>
                                            <th className="px-4 py-3 text-left font-bold text-gray-500">Status</th>
                                            <th className="px-4 py-3 text-left font-bold text-gray-500">Call ID</th>
                                            <th className="px-4 py-3 text-left font-bold text-gray-500">Error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {results.map((r, i) => (
                                            <tr key={`${r.to}-${i}`}>
                                                <td className="px-4 py-3 font-mono">{r.to}</td>
                                                <td className="px-4 py-3">{r.name || '—'}</td>
                                                <td className="px-4 py-3">
                                                    {r.ok ? (
                                                        <Badge variant="success">Queued</Badge>
                                                    ) : (
                                                        <Badge variant="warning">Failed</Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs">{r.id?.slice(0, 12) || '—'}</td>
                                                <td className="px-4 py-3 text-red-500">{r.error || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </Card>
            )}

            {/* Navigation */}
            <div className="flex gap-4">
                <Button variant="outline" onClick={() => navigate('/test-call')}>
                    Single Call
                </Button>
                <Button variant="outline" onClick={() => navigate('/logs')}>
                    View Call Logs
                </Button>
            </div>
        </div>
    );
};

export default BulkCall;

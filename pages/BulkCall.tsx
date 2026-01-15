
import React, { useState, useRef, useMemo } from 'react';
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
    FileText
} from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import { validateE164, parseNumbersFromCSV } from '../hooks/useOutboundCall';
import { API_BASE_URL } from '../lib/config';

type QueueResult = {
    to: string;
    ok: boolean;
    id?: string;
    error?: string
};

const BulkCall: React.FC = () => {
    const navigate = useNavigate();
    const [text, setText] = useState('');
    const [selectedAgentId, setSelectedAgentId] = useState('default');
    const [concurrency, setConcurrency] = useState(3);
    const [starting, setStarting] = useState(false);
    const [results, setResults] = useState<QueueResult[]>([]);
    const abortRef = useRef<AbortController | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { agents, loading: agentsLoading } = useAgents();
    const activeAgents = agents.filter(a => a.status === 'active');

    // Parse and validate numbers
    const parsed = useMemo(() => {
        const list = parseNumbersFromCSV(text);
        const deduped = Array.from(new Set(list));
        const withValidity = deduped.map(n => ({ to: n, valid: validateE164(n) }));
        const valid = withValidity.filter(x => x.valid).map(x => x.to);
        const invalid = withValidity.filter(x => !x.valid).map(x => x.to);
        return { countRaw: list.length, countUnique: deduped.length, valid, invalid };
    }, [text]);

    const progress = useMemo(() => {
        if (!results.length || !parsed.valid.length) return 0;
        return Math.min(100, Math.round((results.length / parsed.valid.length) * 100));
    }, [results.length, parsed.valid.length]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const content = await file.text();
        setText(content);
    };

    async function startQueue() {
        if (parsed.valid.length === 0) {
            alert('No valid numbers to call. Please add at least one valid E.164 number.');
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
                const to = queue[i];

                try {
                    const res = await fetch(`${API_BASE_URL}/outbound-call`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to,
                            agentId: selectedAgentId !== 'default' ? selectedAgentId : undefined
                        }),
                        signal: controller.signal,
                    });
                    const data = await res.json().catch(() => ({}));
                    const ok = res.ok;
                    setResults(prev => [...prev, {
                        to,
                        ok,
                        id: data?.id,
                        error: ok ? undefined : data?.message || 'Failed'
                    }]);
                } catch (e: any) {
                    if (controller.signal.aborted) return;
                    setResults(prev => [...prev, { to, ok: false, error: e?.message || 'Error' }]);
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
        const csv = 'phone,error\n' + failed.map(f => `${f.to},"${f.error || ''}"`).join('\n');
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
                                <p className="text-xs text-gray-500 mt-1">Columns can be in any order</p>
                            </div>
                        </div>
                    </Card>

                    {/* Text Input */}
                    <Card className="p-6 border-2">
                        <div className="space-y-4">
                            <Label className="flex items-center gap-2">
                                <Phone size={18} className="text-vani-plum" />
                                Or Paste Phone Numbers
                            </Label>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="+91XXXXXXXXXX, +91XXXXXXXXXX..."
                                className="w-full h-40 px-4 py-3 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-xl text-sm font-mono dark:text-white outline-none focus:border-vani-plum resize-none"
                            />
                            <p className="text-xs text-gray-500">Separate with commas, semicolons, or newlines.</p>
                        </div>
                    </Card>

                    {/* Agent Selection */}
                    <Card className="p-6 border-2">
                        <div className="space-y-4">
                            <Label>Select Agent for All Calls</Label>
                            {agentsLoading ? (
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
                                    {activeAgents.map(agent => (
                                        <option key={agent._id} value={agent._id}>
                                            {agent.name}
                                        </option>
                                    ))}
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
                                <span className="text-gray-500">Valid</span>
                                <span className="font-bold text-green-500">{parsed.valid.length}</span>
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
                                            <th className="px-4 py-3 text-left font-bold text-gray-500">Status</th>
                                            <th className="px-4 py-3 text-left font-bold text-gray-500">Call ID</th>
                                            <th className="px-4 py-3 text-left font-bold text-gray-500">Error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {results.map((r, i) => (
                                            <tr key={`${r.to}-${i}`}>
                                                <td className="px-4 py-3 font-mono">{r.to}</td>
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

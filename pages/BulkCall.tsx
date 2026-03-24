
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
    FileText,
    Flame,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import { validateE164 } from '../hooks/useOutboundCall';
import { API_BASE_URL } from '../lib/config';
import * as XLSX from 'xlsx';
import { useModalWarmup } from '../hooks/useModalWarmup';

type QueueResult = {
    to: string;
    name?: string;
    ok: boolean;
    id?: string;
    error?: string
};

// ─── Phone Auto-Formatter ──────────────────────────────────────────────────────
// Tries to turn a raw string into an E.164 number.
// Handles:
//  • Already valid: +91XXXXXXXXXX  → +91XXXXXXXXXX
//  • 10-digit Indian:  9XXXXXXXXX  → +919XXXXXXXXX
//  • 11-digit with 0:  09XXXXXXXXX → +919XXXXXXXXX
//  • Strips spaces, dashes, dots, parentheses
function autoFormatPhone(raw: string): string {
    // Remove common formatting characters
    let n = raw.replace(/[\s\-().+]/g, '').trim();
    if (!n) return raw;

    // Already has country code prefix (starts with +)
    if (raw.trim().startsWith('+')) {
        return '+' + n;
    }

    // 10-digit number → prepend +91
    if (/^\d{10}$/.test(n)) {
        return '+91' + n;
    }

    // 11-digit starting with 0 → strip leading 0, prepend +91
    if (/^0\d{10}$/.test(n)) {
        return '+91' + n.slice(1);
    }

    // 12-digit starting with 91 → prepend +
    if (/^91\d{10}$/.test(n)) {
        return '+' + n;
    }

    // 13-digit starting with 091 → +91XXXXXXXXXX
    if (/^091\d{10}$/.test(n)) {
        return '+' + n.slice(1);
    }

    // Return as-is (with + stripped already handled above)
    return raw.trim();
}

// ─── Smart Column Detector ─────────────────────────────────────────────────────
// Given an array of column headers, returns { phoneCol, nameCol } indices.
// Supports any column order and any casing.
function detectColumns(headers: string[]): { phoneCol: number; nameCol: number } {
    const phoneKeywords = ['phone', 'mobile', 'number', 'contact', 'cell', 'tel', 'ph', 'no', 'num'];
    const nameKeywords = ['name', 'customer', 'person', 'client', 'contact', 'full'];
    // cityKeywords are ignored (not mapped to phone or name)

    const normalize = (s: string) => s.toLowerCase().trim();

    let phoneCol = -1;
    let nameCol = -1;

    headers.forEach((h, i) => {
        const hn = normalize(h);
        // Exact keyword match wins first
        if (phoneCol === -1 && phoneKeywords.some(k => hn.includes(k))) phoneCol = i;
        if (nameCol === -1 && nameKeywords.some(k => hn.includes(k))) nameCol = i;
    });

    // If no header match, try auto-detecting by data type:
    // phone column likely has mostly numeric content
    if (phoneCol === -1) {
        // Fall back to last column (very common: CITY,NAME,PHONE)
        phoneCol = headers.length - 1;
    }

    // Name column: whichever non-phone header has alphabetic content  
    if (nameCol === -1 || nameCol === phoneCol) {
        // pick first column that isn't phoneCol and isn't a "city/state/region" col
        const cityKeywords = ['city', 'state', 'region', 'district', 'area', 'zone', 'address'];
        nameCol = headers.findIndex((h, i) => {
            if (i === phoneCol) return false;
            const hn = normalize(h);
            return !cityKeywords.some(k => hn.includes(k));
        });
    }

    return { phoneCol, nameCol };
}

// ─── Parse rows from a 2D array (sheet data) ──────────────────────────────────
// Handles header detection, column auto-detection, phone formatting.
function parseRows(rows: string[][]): { to: string; name: string }[] {
    if (!rows.length) return [];

    // First non-empty row: check if it looks like a header
    // A row is a header if none of its cells look like phone numbers
    const isPhonelike = (s: string) => /\d{7,}/.test(s.replace(/[\s\-+().]/g, ''));

    let headerRow = 0;
    let phoneCol = -1;
    let nameCol = -1;

    // Try to use first row as header
    const firstRow = rows[0].map(c => (c ?? '').toString().trim());
    if (firstRow.some(c => !isPhonelike(c) && c.length > 0)) {
        // Looks like a header row
        ({ phoneCol, nameCol } = detectColumns(firstRow));
        headerRow = 1;
    } else {
        // No header: assume last column is phone, first non-last is name
        phoneCol = firstRow.length - 1;
        nameCol = firstRow.length > 1 ? 0 : -1;
        headerRow = 0;
    }

    const entries: { to: string; name: string }[] = [];

    for (let r = headerRow; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.every(c => !(c ?? '').toString().trim())) continue; // blank row

        const rawPhone = (row[phoneCol] ?? '').toString().trim();
        const rawName = nameCol >= 0 ? (row[nameCol] ?? '').toString().trim() : '';

        if (!rawPhone) continue;

        const phone = autoFormatPhone(rawPhone);
        entries.push({ to: phone, name: rawName });
    }

    return entries;
}

// ─── File reader: CSV or XLSX → rows[][] ──────────────────────────────────────
async function readFileToRows(file: File): Promise<string[][]> {
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx') ||
        file.name.toLowerCase().endsWith('.xls') ||
        file.type.includes('spreadsheet') ||
        file.type.includes('excel');

    if (isXlsx) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Convert to array of arrays; defval='' fills empty cells
        const data: (string | number)[][] = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: '',
            raw: false,  // format everything as strings
        });
        return data.map(row => row.map(cell => (cell ?? '').toString()));
    } else {
        // CSV / plain text
        const text = await file.text();
        const lines = text.split(/\r?\n/);
        return lines.map(line => line.split(',').map(c => c.trim()));
    }
}

// ─── Parse pasted text (textarea) ─────────────────────────────────────────────
function parsePastedText(text: string): string[][] {
    const lines = text.split(/[\n;]/g).map(s => s.trim()).filter(Boolean);
    return lines.map(line => line.split(',').map(c => c.trim()));
}


// ══════════════════════════════════════════════════════════════════════════════
// BulkCall Component
// ══════════════════════════════════════════════════════════════════════════════
const BulkCall: React.FC = () => {
    const navigate = useNavigate();
    const [text, setText] = useState('');
    const [selectedAgentId, setSelectedAgentId] = useState('default');
    const [concurrency, setConcurrency] = useState(3);
    const [starting, setStarting] = useState(false);
    const [results, setResults] = useState<QueueResult[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [parseWarning, setParseWarning] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { agents, loading: agentsLoading } = useAgents();
    const activeAgents = agents.filter(a => a.status === 'active');

    // Look up the full selected agent object for warm-up detection
    const selectedAgent = useMemo(
        () => activeAgents.find(a => a._id === selectedAgentId) ?? null,
        [activeAgents, selectedAgentId]
    );

    const { needsWarmup, isWarmedUp, isWarming, warmupError, responseTimeMs, warmup } = useModalWarmup(selectedAgent);

    // ── Parse & validate numbers ──────────────────────────────────────────
    // Use simple direct parse for textarea: col[0]=phone, col[1]=name.
    // Smart header-detection is only used during file upload (handleFileUpload).
    const parsed = useMemo(() => {
        const lines = text.split(/[\n;]/g).map(s => s.trim()).filter(Boolean);
        const entries: { to: string; name: string }[] = [];
        for (const line of lines) {
            const parts = line.split(',').map(p => p.trim());
            const rawPhone = parts[0];
            const name = parts.slice(1).join(' ').trim(); // rest = name (handles multi-word names)
            if (!rawPhone) continue;
            const phone = autoFormatPhone(rawPhone);
            entries.push({ to: phone, name });
        }

        // Deduplicate by phone number
        const seen = new Set<string>();
        const deduped = entries.filter(e => {
            if (seen.has(e.to)) return false;
            seen.add(e.to);
            return true;
        });

        const withValidity = deduped.map(e => ({ ...e, valid: validateE164(e.to) }));
        const valid = withValidity.filter(x => x.valid);
        const invalid = withValidity.filter(x => !x.valid);

        return { countRaw: entries.length, countUnique: deduped.length, valid, invalid };
    }, [text]);

    const progress = useMemo(() => {
        if (!results.length || !parsed.valid.length) return 0;
        return Math.min(100, Math.round((results.length / parsed.valid.length) * 100));
    }, [results.length, parsed.valid.length]);

    // ── File Upload Handler ───────────────────────────────────────────────
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setParseWarning(null);

        try {
            const rows = await readFileToRows(file);

            // Detect columns from the raw 2D rows
            let phoneCol = -1;
            let nameCol = -1;
            let headerRow = 0;
            const isPhonelike = (s: string) => /\d{7,}/.test(s.replace(/[\s\-+().]/g, ''));

            const firstRow = (rows[0] ?? []).map(c => (c ?? '').toString().trim());
            if (firstRow.some(c => !isPhonelike(c) && c.length > 0)) {
                ({ phoneCol, nameCol } = detectColumns(firstRow));
                headerRow = 1;
            } else {
                phoneCol = firstRow.length - 1;
                nameCol = firstRow.length > 1 ? 0 : -1;
                headerRow = 0;
            }

            // Warn user if we auto-detected non-obvious column
            if (headerRow === 1) {
                const headerNames = firstRow;
                setParseWarning(
                    `Auto-detected: Phone column = "${headerNames[phoneCol] ?? phoneCol}"` +
                    (nameCol >= 0 ? `, Name column = "${headerNames[nameCol] ?? nameCol}"` : '')
                );
            }

            // Convert rows to textarea-friendly text (phone,name per line)
            const entries = parseRows(rows);
            const lines = entries.map(e => e.name ? `${e.to},${e.name}` : e.to);
            setText(lines.join('\n'));
        } catch (err: any) {
            setParseWarning(`Failed to read file: ${err?.message || 'Unknown error'}`);
        }

        // Reset input so same file can be re-uploaded
        e.target.value = '';
    };

    // ── Start Queue ───────────────────────────────────────────────────────
    async function startQueue() {
        if (parsed.valid.length === 0) {
            alert('No valid numbers to call. Please add at least one valid number.');
            return;
        }

        if (selectedAgentId === 'default' || !selectedAgentId) {
            alert('Please select an agent for bulk calls.');
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
                const { to, name } = queue[i];

                try {
                    const body: any = { to, agentId: selectedAgentId };
                    if (name) body.variables = { name };

                    const res = await fetch(`${API_BASE_URL}/api/independent-calls/outbound`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('vani_access_token')}`
                        },
                        body: JSON.stringify(body),
                        signal: controller.signal,
                    });
                    const data = await res.json().catch(() => ({}));
                    const ok = res.ok;
                    setResults(prev => [...prev, {
                        to,
                        name,
                        ok,
                        id: data?.call?.sid || data?.call?.id,
                        error: ok ? undefined : data?.error || data?.message || 'Failed'
                    }]);
                } catch (e: any) {
                    if (controller.signal.aborted) return;
                    setResults(prev => [...prev, { to, name, ok: false, error: e?.message || 'Error' }]);
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
            alert('No failures. All calls were queued successfully!');
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
                    Upload an Excel / CSV file or paste phone numbers. Any column order is supported.
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
                                Upload Excel / CSV File
                            </Label>
                            <div
                                className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-vani-plum/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={async (e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) {
                                        const synth = { target: { files: [file], value: '' } } as any;
                                        await handleFileUpload(synth);
                                    }
                                }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                                {fileName ? (
                                    <p className="text-sm font-semibold text-vani-plum">{fileName}</p>
                                ) : (
                                    <p className="text-sm font-medium dark:text-white">Click or drag & drop CSV / Excel file</p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                    Supports any column order — phone, name, city, state etc.<br />
                                    Numbers auto-formatted to international format (e.g. 9XXXXXXXXX → +919XXXXXXXXX)
                                </p>
                            </div>

                            {/* Parse warning / column info */}
                            {parseWarning && (
                                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-800 dark:text-blue-300 text-xs">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    <span>{parseWarning}</span>
                                </div>
                            )}

                            {/* Invalid numbers warning */}
                            {parsed.invalid.length > 0 && text && (
                                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-yellow-800 dark:text-yellow-400 text-xs">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    <span>
                                        {parsed.invalid.length} number(s) could not be formatted automatically and will be skipped:{' '}
                                        {parsed.invalid.slice(0, 3).map(x => x.to).join(', ')}
                                        {parsed.invalid.length > 3 ? ` +${parsed.invalid.length - 3} more` : ''}
                                    </span>
                                </div>
                            )}
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
                                placeholder={`Paste numbers here — any of these formats work:\n+919876543210\n9876543210\n+919876543210,John Doe\nCITY,NAME,PHONE (auto-detected from CSV header)`}
                                className="w-full h-44 px-4 py-3 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-xl text-sm font-mono dark:text-white outline-none focus:border-vani-plum resize-none"
                            />
                            <p className="text-xs text-gray-500">
                                10-digit numbers are auto-converted to <code className="bg-gray-100 dark:bg-white/10 px-1 rounded text-vani-plum">+91XXXXXXXXXX</code>.
                                Separate entries with newlines or semicolons.
                            </p>
                        </div>
                    </Card>

                    {/* Agent Selection */}
                    <Card className="p-6 border-2">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Select Agent for All Calls</Label>
                                <Badge className="bg-vani-plum text-white text-xs">Required</Badge>
                            </div>
                            {agentsLoading ? (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Loader2 size={16} className="animate-spin" />
                                    Loading agents...
                                </div>
                            ) : activeAgents.length === 0 ? (
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-yellow-800 dark:text-yellow-400 text-sm">
                                    No active agents. <button type="button" onClick={() => navigate('/agents/create')} className="underline font-bold">Create one first</button>
                                </div>
                            ) : (
                                <select
                                    value={selectedAgentId}
                                    onChange={(e) => setSelectedAgentId(e.target.value)}
                                    className="w-full h-12 px-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-xl text-base dark:text-white outline-none focus:border-vani-plum font-medium"
                                >
                                    <option value="default">-- Select Agent --</option>
                                    {activeAgents.map(agent => (
                                        <option key={agent._id} value={agent._id}>
                                            {agent.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <p className="text-xs text-gray-500">
                                Independent pipeline requires agent selection
                            </p>
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
                                <span className="text-gray-500">Valid ✓</span>
                                <span className="font-bold text-green-500">{parsed.valid.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Skipped ✗</span>
                                <span className="font-bold text-red-500">{parsed.invalid.length}</span>
                            </div>
                        </div>

                        {/* Preview of first few valid */}
                        {parsed.valid.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                                <p className="text-xs text-gray-500 font-semibold mb-2">Preview (first 3)</p>
                                {parsed.valid.slice(0, 3).map((e, i) => (
                                    <div key={i} className="text-xs font-mono dark:text-white truncate">
                                        {e.to}{e.name ? ` · ${e.name}` : ''}
                                    </div>
                                ))}
                            </div>
                        )}
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

                    {/* Modal Warm-Up — only shown for Chatterbox agents */}
                    {needsWarmup && (
                        <Card className={`p-5 border-2 space-y-3 ${
                            isWarmedUp
                                ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                                : 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                    isWarmedUp ? 'bg-green-500' : 'bg-orange-500'
                                }`}>
                                    {isWarmedUp
                                        ? <CheckCircle size={18} className="text-white" />
                                        : <Flame size={18} className="text-white" />
                                    }
                                </div>
                                <div className="min-w-0">
                                    <p className={`font-bold text-sm ${
                                        isWarmedUp ? 'text-green-800 dark:text-green-200' : 'text-orange-800 dark:text-orange-200'
                                    }`}>
                                        {isWarmedUp
                                            ? `Modal warm ${responseTimeMs ? `(${responseTimeMs}ms)` : ''}— ready!`
                                            : 'Warm up Modal first'
                                        }
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {isWarmedUp
                                            ? 'Chatterbox ready — bulk calls will start quickly.'
                                            : 'Modal goes cold between calls. Warm it up before starting.'
                                        }
                                    </p>
                                </div>
                            </div>

                            {warmupError && (
                                <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                                    <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                    <span>{warmupError}</span>
                                </div>
                            )}

                            {!isWarmedUp && (
                                <Button
                                    className="w-full h-10 text-sm bg-orange-500 hover:bg-orange-600 text-white border-0"
                                    onClick={warmup}
                                    disabled={isWarming || starting}
                                >
                                    {isWarming ? (
                                        <><Loader2 size={14} className="mr-2 animate-spin" />Warming up… (~30s)</>
                                    ) : (
                                        <><Flame size={14} className="mr-2" />{warmupError ? 'Retry Warm Up' : 'Warm Up Modal'}</>
                                    )}
                                </Button>
                            )}
                        </Card>
                    )}

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
                                disabled={parsed.valid.length === 0 || selectedAgentId === 'default' || !selectedAgentId || (needsWarmup && !isWarmedUp)}
                            >
                                <Play size={18} className="mr-2" />
                                {needsWarmup && !isWarmedUp ? 'Warm Up First' : `Start Calls (${parsed.valid.length})`}
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="w-full h-12"
                            onClick={() => { setText(''); setFileName(null); setParseWarning(null); }}
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

                    <div className="h-3 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mb-4">
                        <div
                            className="h-full vani-gradient transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

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
                                                <td className="px-4 py-3 text-sm">{r.name || '—'}</td>
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

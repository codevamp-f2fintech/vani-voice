
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Input } from '../components/UI';
import {
  Play,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  PhoneIncoming,
  PhoneOutgoing,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useCalls, formatDuration, formatCost } from '../hooks/useCalls';
import { useAgents } from '../hooks/useAgents';
import type { Call } from '../lib/types';

const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <label className={`block text-[10px] font-bold text-gray-400 uppercase tracking-widest ${className}`}>
    {children}
  </label>
);

const LogsRecordings: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [agentFilter, setAgentFilter] = useState<string[]>([]);

  const { calls, loading, error } = useCalls({
    page,
    search,
    status: statusFilter,
    from: dateFrom,
    to: dateTo
  });

  const { agents } = useAgents();

  const filteredCalls = useMemo(() => {
    if (agentFilter.length === 0) return calls;
    return calls.filter(c => agentFilter.includes(c.agentName || ''));
  }, [calls, agentFilter]);

  const toggleAgentFilter = (name: string) => {
    setAgentFilter(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const exportCSV = () => {
    const headers = ['id', 'phone', 'agent', 'status', 'duration', 'cost', 'created'];
    const rows = filteredCalls.map(c => [
      c._id,
      c.customer?.number || '',
      c.agentName || '',
      c.status,
      formatDuration(c.startedAt, c.endedAt),
      formatCost(c.cost),
      c.createdAt
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'call-logs.csv';
    a.click();
  };

  if (loading && calls.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-vani-plum" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Call Logs & Recordings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Review conversations and monitor agent performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter size={16} className="mr-2" /> Filter</Button>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download size={16} className="mr-2" /> Export</Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <Card className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search phone..."
                className="pl-9 py-1.5"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date Range</Label>
              <input
                type="date"
                className="w-full text-sm bg-transparent dark:text-white outline-none border border-gray-200 dark:border-white/10 rounded-lg p-2"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <input
                type="date"
                className="w-full text-sm bg-transparent dark:text-white outline-none border border-gray-200 dark:border-white/10 rounded-lg p-2"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="w-full text-sm bg-transparent dark:text-white outline-none border border-gray-200 dark:border-white/10 rounded-lg p-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="ended">Ended</option>
                <option value="in-progress">In Progress</option>
                <option value="queued">Queued</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Agent Filter</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {agents.map(a => (
                  <label key={a._id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-vani-plum">
                    <input
                      type="checkbox"
                      className="accent-vani-plum"
                      checked={agentFilter.includes(a.name)}
                      onChange={() => toggleAgentFilter(a.name)}
                    />
                    {a.name}
                  </label>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="md:col-span-3 space-y-4">
          <Card className="overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Date & Agent</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Duration</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Cost</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredCalls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No calls found. Adjust filters or make some calls.
                    </td>
                  </tr>
                ) : (
                  filteredCalls.map((call) => (
                    <tr
                      key={call._id}
                      className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => navigate(`/call-logs/${call._id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${call.type === 'inboundPhoneCall' ? 'bg-blue-500/10 text-blue-500' : 'bg-vani-plum/10 text-vani-plum'}`}>
                            {call.type === 'inboundPhoneCall' ? <PhoneIncoming size={14} /> : <PhoneOutgoing size={14} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold dark:text-gray-200">{call.agentName || 'Unknown'}</p>
                            <p className="text-[10px] text-gray-500">
                              {call.createdAt ? new Date(call.createdAt).toLocaleString() : '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                        {call.customer?.number || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDuration(call.startedAt, call.endedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold dark:text-white">
                        {formatCost(call.cost)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={call.status === 'ended' ? 'success' : 'warning'}>
                          {call.status || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {call.recordingUrl && (
                            <button
                              className="p-1.5 rounded hover:bg-vani-plum/10 text-vani-plum opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => { e.stopPropagation(); }}
                            >
                              <Play size={16} />
                            </button>
                          )}
                          <button
                            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-vani-plum opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); navigate(`/call-logs/${call._id}`); }}
                          >
                            <ExternalLink size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-xs text-gray-500">Showing {filteredCalls.length} calls</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 py-1"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 py-1"
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LogsRecordings;

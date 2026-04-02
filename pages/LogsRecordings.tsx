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
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText,
  Trash2
} from 'lucide-react';
import { useCalls, formatDuration, formatCost, formatDurationSeconds } from '../hooks/useCalls';
import { useAgents } from '../hooks/useAgents';
import type { Call } from '../lib/types';

const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <label className={`block text-[10px] font-bold text-gray-400 uppercase tracking-widest ${className}`}>
    {children}
  </label>
);

const LogsRecordings: React.FC = () => {
  const navigate = useNavigate();
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [agentFilter, setAgentFilter] = useState<string[]>([]);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const { calls, totalCount, totalDurationSeconds, loading, error, refetch, deleteCalls } = useCalls({
    page,
    limit: PAGE_SIZE,
    search,
    status: statusFilter,
    from: dateFrom,
    to: dateTo
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCalls.map(c => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} calls?`)) return;
    
    setIsDeleting(true);
    const result = await deleteCalls(selectedIds);
    setIsDeleting(false);
    
    if (result.success) {
      setSelectedIds([]);
      // refetch is automatically called inside deleteCalls, but we can clear selection safely
    } else {
      alert(`Failed to delete calls: ${result.error}`);
    }
  };

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
    const headers = ['id', 'phone', 'agent', 'status', 'duration', 'cost', 'created', 'summary'];
    const rows = filteredCalls.map(c => [
      c._id,
      c.customer?.number || '',
      c.agentName || '',
      c.status,
      formatDuration(c.startedAt, c.endedAt),
      formatCost(c.cost),
      c.createdAt,
      `"${(c.summary || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'call-logs.csv';
    a.click();
  };

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / PAGE_SIZE));

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
          <p className="text-sm text-gray-500 dark:text-gray-400">Review conversations, summaries, and agent performance.</p>
        </div>
        <div className="flex gap-2 items-center">
          {selectedIds.length > 0 && (
            <Button variant="danger" size="sm" onClick={handleDeleteSelected} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 text-white border-none flex items-center gap-2">
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} 
              Delete {selectedIds.length} Selected
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportCSV}><Download size={16} className="mr-2" /> Export CSV</Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="p-4 bg-linear-to-br from-vani-plum/10 to-transparent border-vani-plum/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-vani-plum mb-1">Total Calls</h3>
            <p className="text-2xl font-black dark:text-white">{totalCount || 0}</p>
         </Card>
         <Card className="p-4 bg-linear-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-1">Total Duration</h3>
            <p className="text-2xl font-black dark:text-white">{formatDurationSeconds(totalDurationSeconds || 0)}</p>
         </Card>
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
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              />
              <input
                type="date"
                className="w-full text-sm bg-transparent dark:text-white outline-none border border-gray-200 dark:border-white/10 rounded-lg p-2"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="w-full text-sm bg-transparent dark:text-white outline-none border border-gray-200 dark:border-white/10 rounded-lg p-2"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="ended">Ended</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="queued">Queued</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Agent Filter (Local)</Label>
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
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input 
                        type="checkbox" 
                        className="accent-vani-plum cursor-pointer"
                        checked={filteredCalls.length > 0 && selectedIds.length === filteredCalls.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Date & Agent</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Contact</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Summary Preview</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Details</th>
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
                      <React.Fragment key={call._id}>
                        <tr
                          className={`group transition-colors cursor-pointer ${expandedCallId === call._id ? 'bg-vani-plum/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                          onClick={() => setExpandedCallId(expandedCallId === call._id ? null : call._id)}
                        >
                          <td className="px-6 py-4 border-l-2 border-transparent group-hover:border-vani-plum" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              className="accent-vani-plum cursor-pointer"
                              checked={selectedIds.includes(call._id)}
                              onChange={() => handleSelectOne(call._id)}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${call.type === 'inboundPhoneCall' ? 'bg-blue-500/10 text-blue-500' : 'bg-vani-plum/10 text-vani-plum'}`}>
                                {call.type === 'inboundPhoneCall' ? <PhoneIncoming size={14} /> : <PhoneOutgoing size={14} />}
                              </div>
                              <div>
                                <p className="text-sm font-bold dark:text-gray-200">{call.agentName || 'Unknown'}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                  {call.createdAt ? new Date(call.createdAt).toLocaleString() : '—'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-mono text-gray-600 dark:text-gray-300">
                              {call.customer?.number || '—'}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-1">
                              {formatDuration(call.startedAt, call.endedAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 w-1/3">
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2" title={call.summary}>
                                {call.summary ? call.summary : <span className="italic text-gray-400">No summary available</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={['ended', 'completed'].includes(call.status || '') ? 'success' : 'warning'}>
                              {call.status || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 text-gray-400">
                               <button 
                                 className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-vani-plum transition-all"
                                 onClick={(e) => { e.stopPropagation(); navigate(`/call-logs/${call._id}`); }}
                                 title="View Full Details & Transcript"
                               >
                                  <ExternalLink size={18} />
                               </button>
                               <div className="w-6 h-6 flex items-center justify-center p-1 rounded-full bg-gray-100 dark:bg-white/5">
                                 {expandedCallId === call._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                               </div>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Area */}
                        {expandedCallId === call._id && (
                          <tr className="bg-gray-50/50 dark:bg-black/20">
                            <td colSpan={6} className="px-6 py-6 border-b border-gray-100 dark:border-white/5">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="md:col-span-2 space-y-4">
                                     <div className="flex items-center gap-2 text-vani-plum font-bold text-sm">
                                        <MessageSquare size={16} /> Detailed Summary
                                     </div>
                                     <div className="bg-white dark:bg-[#1A1A1C] p-4 rounded-xl border border-gray-200 dark:border-white/5">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                          {call.summary || 'Summary not generated for this call.'}
                                        </p>
                                     </div>
                                  </div>
                                  
                                  <div className="space-y-4">
                                     <div className="flex items-center gap-2 text-vani-plum font-bold text-sm">
                                        <FileText size={16} /> Call Metadata
                                     </div>
                                     <div className="bg-white dark:bg-[#1A1A1C] p-4 rounded-xl border border-gray-200 dark:border-white/5 space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                           <span className="text-gray-500">Duration</span>
                                           <span className="font-bold dark:text-white">{formatDuration(call.startedAt, call.endedAt)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                           <span className="text-gray-500">Cost</span>
                                           <span className="font-bold dark:text-white">{formatCost(call.cost)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                           <span className="text-gray-500">Lead Status</span>
                                           <Badge variant={call.leadStatus === 'follow-up' ? 'warning' : 'success'} className="uppercase text-[10px]">
                                             {call.leadStatus || 'unknown'}
                                           </Badge>
                                        </div>
                                        {call.endedReason && (
                                          <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100 dark:border-white/5">
                                             <span className="text-gray-500">End Reason</span>
                                             <span className="font-bold text-gray-700 dark:text-gray-300 text-right">{call.endedReason}</span>
                                          </div>
                                        )}
                                     </div>
                                     
                                     <Button 
                                       className="w-full mt-2" 
                                       onClick={() => navigate(`/call-logs/${call._id}`)}
                                     >
                                        View Full Transcript
                                     </Button>
                                  </div>
                               </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-gray-500 font-medium">
                Showing {totalCount > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, totalCount || 0)} of {totalCount || 0} calls
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={16} className="mr-1" /> Prev
                </Button>
                <div className="text-xs font-bold px-2 text-gray-500">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                >
                  Next <ChevronRight size={16} className="ml-1" />
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

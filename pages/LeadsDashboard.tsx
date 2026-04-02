import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../components/UI';
import {
  Download,
  Filter,
  Loader2,
  ExternalLink,
  PhoneCall,
  Calendar,
  Clock,
  MessageSquare,
  User,
  Star,
  Tag,
  TrendingUp,
  Bell,
  CheckCircle2,
  Users,
  BarChart3,
} from 'lucide-react';
import { useLeads, formatDuration } from '../hooks/useCalls';
import { useAgents } from '../hooks/useAgents';

type LeadStatusFilter = 'all' | 'interested' | 'follow-up';

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = ({ icon, label, value, color, bgColor, borderColor }) => (
  <div
    className={`relative overflow-hidden rounded-2xl border ${borderColor} ${bgColor} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
          {label}
        </p>
        <p className={`text-3xl font-black ${color}`}>{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl ${bgColor} border ${borderColor} flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
    <div className={`absolute bottom-0 right-0 w-20 h-20 rounded-full opacity-10 ${bgColor} -mb-6 -mr-6 border ${borderColor}`} />
  </div>
);

const LeadsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [campaignFilter, setCampaignFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<LeadStatusFilter>('all');

  const { leads, loading, error } = useLeads({ agentId: agentFilter || undefined });
  const { agents } = useAgents();

  // Stats
  const stats = useMemo(() => {
    const total = leads.length;
    const interested = leads.filter(l => l.leadStatus === 'interested').length;
    const followUp = leads.filter(l => l.leadStatus === 'follow-up').length;
    return { total, interested, followUp };
  }, [leads]);

  // Extract unique campaigns
  const uniqueCampaigns = useMemo(() => {
    const campaigns = new Set<string>();
    leads.forEach(l => {
      if (l.campaignName) campaigns.add(l.campaignName);
    });
    return Array.from(campaigns).sort();
  }, [leads]);

  // Apply frontend filters
  const filteredLeads = useMemo(() => {
    let result = leads;
    if (campaignFilter) result = result.filter(l => l.campaignName === campaignFilter);
    if (statusFilter === 'interested') result = result.filter(l => l.leadStatus === 'interested');
    if (statusFilter === 'follow-up') result = result.filter(l => l.leadStatus === 'follow-up');
    return result;
  }, [leads, campaignFilter, statusFilter]);

  const exportCSV = () => {
    const headers = ['id', 'phone', 'agent', 'campaign', 'lead_status', 'duration', 'summary', 'created'];
    const rows = filteredLeads.map(c => [
      c._id,
      c.customer?.number || '',
      c.agentName || '',
      `"${(c.campaignName || '').replace(/"/g, '""')}"`,
      c.leadStatus || 'unknown',
      formatDuration(c.startedAt, c.endedAt),
      `"${(c.summary || '').replace(/"/g, '""')}"`,
      c.createdAt
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-vani-plum" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black dark:text-white flex items-center gap-3">
            <Star className="text-vani-plum" fill="currentColor" size={28} />
            Interested Leads
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Automatically extracted high-intent prospects from your AI calls.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Campaign Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <select
              className="pl-8 pr-4 py-2 bg-white dark:bg-[#1A1A1C] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 outline-none hover:border-vani-plum/50 focus:border-vani-plum transition-colors appearance-none"
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
            >
              <option value="">All Campaigns</option>
              {uniqueCampaigns.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {/* Agent Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <select
              className="pl-8 pr-4 py-2 bg-white dark:bg-[#1A1A1C] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 outline-none hover:border-vani-plum/50 focus:border-vani-plum transition-colors appearance-none"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
            >
              <option value="">All Agents</option>
              {agents.map(a => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={exportCSV} className="vani-gradient shadow-lg shadow-vani-plum/20">
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Users size={20} />}
          label="Total Leads"
          value={stats.total}
          color="text-vani-plum"
          bgColor="dark:bg-vani-plum/10 bg-violet-50"
          borderColor="border-vani-plum/20"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Interested"
          value={stats.interested}
          color="text-emerald-500"
          bgColor="dark:bg-emerald-500/10 bg-emerald-50"
          borderColor="border-emerald-500/20"
        />
        <StatCard
          icon={<Bell size={20} />}
          label="Follow Ups"
          value={stats.followUp}
          color="text-amber-500"
          bgColor="dark:bg-amber-500/10 bg-amber-50"
          borderColor="border-amber-500/20"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit border border-gray-200 dark:border-white/10">
        {[
          { key: 'all' as LeadStatusFilter, label: 'All Leads', icon: <BarChart3 size={14} />, count: stats.total },
          { key: 'interested' as LeadStatusFilter, label: 'Interested', icon: <CheckCircle2 size={14} />, count: stats.interested },
          { key: 'follow-up' as LeadStatusFilter, label: 'Follow Ups', icon: <Bell size={14} />, count: stats.followUp },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              statusFilter === tab.key
                ? 'bg-white dark:bg-white/10 text-vani-plum shadow-sm border border-vani-plum/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
              statusFilter === tab.key
                ? 'bg-vani-plum/10 text-vani-plum'
                : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 font-medium">
          {error}
        </div>
      )}

      {filteredLeads.length === 0 && !loading && !error && (
        <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed border-2 bg-transparent dark:bg-transparent">
          <div className="w-16 h-16 rounded-full bg-vani-plum/10 text-vani-plum flex items-center justify-center mb-4">
            <Star size={32} />
          </div>
          <h3 className="text-xl font-bold dark:text-white mb-2">No leads found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            {statusFilter === 'follow-up'
              ? 'No follow-up leads found. Leads marked for follow-up will appear here.'
              : statusFilter === 'interested'
              ? 'No interested leads found yet.'
              : `AI has not identified any interested leads ${agentFilter ? 'for this agent' : 'yet'}. Start making calls to see them appear here automatically!`}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <Card
            key={lead._id}
            className="group hover:border-vani-plum/50 hover:shadow-xl hover:shadow-vani-plum/10 transition-all duration-300 overflow-hidden cursor-pointer"
            onClick={() => navigate(`/call-logs/${lead._id}`, { state: { from: '/leads' } })}
          >
            <div className="p-5 border-b border-gray-100 dark:border-white/5 bg-linear-to-br from-vani-blue/5 to-transparent">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full vani-gradient flex items-center justify-center text-white shadow-md">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg dark:text-white font-mono tracking-tight">
                      {lead.customer?.number || 'Unknown Number'}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <div className="flex items-center gap-1.5">
                        <PhoneCall size={12} />
                        <span className="font-medium">{lead.agentName || 'Unknown Agent'}</span>
                      </div>
                      {lead.campaignName && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-white/10 rounded-md">
                          <Tag size={10} className="text-vani-plum" />
                          <span className="font-bold text-[10px] uppercase tracking-wider">{lead.campaignName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Badge
                  variant={lead.leadStatus === 'follow-up' ? 'warning' : 'success'}
                  className="px-3 py-1 shadow-sm uppercase tracking-wide text-[10px] font-black"
                >
                  {lead.leadStatus === 'follow-up' ? '🔔 Follow Up' : '✅ Interested'}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-vani-plum" />
                  {new Date(lead.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-vani-plum" />
                  {formatDuration(lead.startedAt, lead.endedAt)}
                </div>
              </div>
            </div>

            <div className="p-5 bg-gray-50/50 dark:bg-white/2">
              <div className="flex gap-3">
                <MessageSquare size={16} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                  {lead.summary || 'No summary generated for this call.'}
                </p>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 dark:border-white/5 flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-[#1A1A1C]">
              <span className="text-xs font-bold text-vani-plum flex items-center gap-1.5">
                View Transcript <ExternalLink size={14} />
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LeadsDashboard;

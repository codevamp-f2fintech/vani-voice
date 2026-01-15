
import React, { useMemo } from 'react';
import { Card, Badge, Button } from '../components/UI';
import {
  PhoneCall,
  Clock,
  TrendingUp,
  Users,
  ChevronRight,
  Play,
  ArrowUpRight,
  MoreHorizontal,
  Plus,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgentStats, useAgents } from '../hooks/useAgents';
import { useCalls, formatDuration, formatCost } from '../hooks/useCalls';

const MockChart: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 400 100" className="w-full h-24 mt-4 drop-shadow-lg">
    <defs>
      <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
    </defs>
    <path
      d="M0 80 Q 40 20, 80 70 T 160 50 T 240 85 T 320 30 T 400 60"
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M0 80 Q 40 20, 80 70 T 160 50 T 240 85 T 320 30 T 400 60 V 100 H 0 Z"
      fill={`url(#grad-${color})`}
    />
  </svg>
);

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const { stats, loading: statsLoading } = useAgentStats();
  const { agents, loading: agentsLoading } = useAgents();
  const { calls, loading: callsLoading } = useCalls({ limit: 5 });

  const dashboardStats = useMemo(() => [
    {
      label: 'Total Calls',
      value: stats?.totalCalls?.toLocaleString() || '0',
      trend: '+12%',
      icon: PhoneCall,
      color: '#560BAD'
    },
    {
      label: 'Success Rate',
      value: stats?.totalCalls
        ? `${Math.round((stats.successfulCalls / stats.totalCalls) * 100)}%`
        : '0%',
      trend: '+3%',
      icon: TrendingUp,
      color: '#10B981'
    },
    {
      label: 'Active Agents',
      value: stats?.activeAgents?.toString() || '0',
      trend: '0%',
      icon: Users,
      color: '#F72585'
    },
    {
      label: 'Total Agents',
      value: stats?.totalAgents?.toString() || '0',
      trend: '+8%',
      icon: Clock,
      color: '#B5179E'
    },
  ], [stats]);

  const recentCalls = useMemo(() => {
    return calls.slice(0, 4).map(call => ({
      id: call._id,
      name: call.agentName || 'Unknown Agent',
      duration: formatDuration(call.startedAt, call.endedAt),
      cost: formatCost(call.cost),
      time: call.createdAt ? new Date(call.createdAt).toLocaleString() : '—',
      status: call.status === 'ended' ? 'Completed' : call.status || 'Unknown'
    }));
  }, [calls]);

  const activeAgentsList = useMemo(() => {
    return agents.filter(a => a.status === 'active').slice(0, 3);
  }, [agents]);

  const isLoading = statsLoading || callsLoading || agentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-vani-plum" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black dark:text-white tracking-tight">Dashboard Overview 👋</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Here's what's happening with your Voice Agents today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">Download Report</Button>
          <Button size="sm" onClick={() => navigate('/agents/create')}>
            <Plus size={16} className="mr-2" /> Create New Agent
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, i) => (
          <Card key={i} className="p-6 relative overflow-hidden group">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/5" style={{ color: stat.color }}>
                <stat.icon size={20} />
              </div>
              <span className={`text-xs font-bold ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</h3>
            <p className="text-3xl font-black dark:text-white tracking-tight">{stat.value}</p>
            <MockChart color={stat.color} />
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black dark:text-white tracking-tight">Recent Call Activity</h2>
            <Button variant="ghost" size="sm" className="text-vani-plum" onClick={() => navigate('/logs')}>
              View All <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>

          <Card className="overflow-hidden border-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Agent</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Duration</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Cost</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Time</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {recentCalls.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No calls yet. Start making calls to see activity here.
                      </td>
                    </tr>
                  ) : (
                    recentCalls.map((call) => (
                      <tr key={call.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-vani-blue/10 flex items-center justify-center text-vani-blue">
                              <Play size={14} />
                            </div>
                            <span className="text-sm font-semibold dark:text-gray-200">{call.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{call.duration}</td>
                        <td className="px-6 py-4 text-sm font-medium dark:text-white">{call.cost}</td>
                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-500">{call.time}</td>
                        <td className="px-6 py-4">
                          <Badge variant={call.status === 'Completed' ? 'success' : 'warning'}>{call.status}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400">
                            <MoreHorizontal size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-black dark:text-white tracking-tight">Active Agents</h2>
          <div className="space-y-4">
            {activeAgentsList.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500 mb-4">No active agents yet</p>
                <Button onClick={() => navigate('/agents/create')}>Create Agent</Button>
              </Card>
            ) : (
              activeAgentsList.map((agent) => (
                <Card key={agent._id} className="p-5 group border-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-vani-plum/10 flex items-center justify-center text-vani-plum group-hover:bg-vani-plum group-hover:text-white transition-all">
                        <Users size={24} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold dark:text-white">{agent.name}</h4>
                        <p className="text-xs text-gray-500 font-medium tracking-tight">
                          {agent.metadata?.category || 'General'} • {agent.status}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">Live</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-4 border-t border-gray-100 dark:border-white/5 font-semibold">
                    <span className="text-gray-500 italic">{agent.statistics?.totalCalls || 0} calls total</span>
                    <button
                      onClick={() => navigate(`/agents/${agent._id}/edit`)}
                      className="text-vani-plum font-bold flex items-center hover:translate-x-1 transition-transform"
                    >
                      Edit Agent <ArrowUpRight size={14} className="ml-1" />
                    </button>
                  </div>
                </Card>
              ))
            )}
            <Button variant="outline" className="w-full border-dashed py-6" onClick={() => navigate('/agents')}>View All Agents</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;

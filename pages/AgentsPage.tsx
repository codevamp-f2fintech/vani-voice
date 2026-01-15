
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../components/UI';
import { PlusCircle, Search, Phone, Settings, Play, Trash2, Loader2 } from 'lucide-react';
import { useAgents, deleteAgent } from '../hooks/useAgents';

const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { agents, loading, error, refetch } = useAgents(debouncedSearch);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      setDeleting(true);
      setDeleteId(id);
      await deleteAgent(id);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to delete agent');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-vani-plum" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black dark:text-white tracking-tight">Your Agents</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Manage and monitor all your Voice AI characters.</p>
        </div>
        <Button onClick={() => navigate('/agents/create')} className="h-14 px-8 shadow-xl">
          <PlusCircle size={20} className="mr-2" /> New Agent
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          placeholder="Search agents by name or language..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-vani-plum/10 outline-none dark:text-white font-bold"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {agents.length === 0 && !loading ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Phone size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold dark:text-white mb-2">No agents found</h3>
          <p className="text-gray-500 mb-6">Create your first Voice AI agent to get started.</p>
          <Button onClick={() => navigate('/agents/create')}>
            <PlusCircle size={18} className="mr-2" /> Create Agent
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {agents.map((agent) => (
            <Card key={agent._id} className="p-8 group hover:border-vani-plum transition-all duration-300 border-2">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-vani-plum/10 flex items-center justify-center text-vani-plum group-hover:bg-vani-plum group-hover:text-white transition-all">
                  <Phone size={28} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={agent.status === 'active' ? 'success' : 'default'}>{agent.status}</Badge>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {agent.statistics?.lastUsed
                      ? new Date(agent.statistics.lastUsed).toLocaleDateString()
                      : 'Never used'}
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-black dark:text-white tracking-tight mb-2">{agent.name}</h3>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
                {agent.metadata?.category || 'General'} • v{agent.metadata?.version || 1}
              </p>

              <div className="grid grid-cols-2 gap-4 py-6 border-y border-gray-100 dark:border-white/5 mb-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Calls</p>
                  <p className="text-lg font-black dark:text-white">{agent.statistics?.totalCalls || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Success Rate</p>
                  <p className="text-lg font-black dark:text-white">
                    {agent.statistics?.totalCalls > 0
                      ? Math.round((agent.statistics.successfulCalls / agent.statistics.totalCalls) * 100)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" onClick={() => navigate(`/agents/${agent._id}/edit`)}>
                  <Settings size={16} className="mr-2" /> Edit
                </Button>
                <Button className="flex-1" onClick={() => navigate(`/agents/${agent._id}/test`)}>
                  <Play size={16} className="mr-2" /> Test
                </Button>
                <Button
                  variant="outline"
                  className="px-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleDelete(agent._id)}
                  disabled={deleting && deleteId === agent._id}
                >
                  {deleting && deleteId === agent._id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentsPage;

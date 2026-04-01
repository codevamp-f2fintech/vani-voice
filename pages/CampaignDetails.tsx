import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../components/UI';
import { Play, Pause, Download, ChevronLeft, Loader2, StopCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../lib/config';

type CampaignLead = {
    _id: string;
    to: string;
    name?: string;
    status: string;
    callSid?: string;
    errorMessage?: string;
};

type Campaign = {
    _id: string;
    name: string;
    status: string;
    concurrency: number;
    totalLeads: number;
    completedLeads: number;
    failedLeads: number;
};

const CampaignDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [leads, setLeads] = useState<CampaignLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    const fetchDetails = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/campaigns/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('vani_access_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCampaign(data.campaign);
                setLeads(data.leads);
            } else if (res.status === 404) {
                navigate('/campaigns');
            }
        } catch (error) {
            console.error('Failed to fetch campaign details', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
        // Poll aggressively for live updates if running
        const interval = setInterval(() => {
            fetchDetails();
        }, 3000);
        return () => clearInterval(interval);
    }, [id]);

    const handleControl = async (action: 'pause' | 'resume' | 'cancel') => {
        if (!campaign || toggling) return;
        setToggling(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/campaigns/${id}/control`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('vani_access_token')}` 
                },
                body: JSON.stringify({ action })
            });
            if (res.ok) {
                fetchDetails();
            }
        } catch (error) {
            console.error(`Failed to ${action} campaign`, error);
        } finally {
            setToggling(false);
        }
    };

    const downloadFailures = () => {
        const failed = leads.filter(l => l.status === 'failed');
        if (!failed.length) return alert('No failures to download.');
        const csv = 'phone,name,error\n' + failed.map(f => `${f.to},${f.name || ''},"${f.errorMessage || ''}"`).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `failures-${campaign?.name || 'campaign'}.csv`;
        a.click();
    };

    if (loading && !campaign) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-vani-plum" size={32} /></div>;
    }

    if (!campaign) return <div>Campaign not found</div>;

    const handled = campaign.completedLeads + campaign.failedLeads;
    const progress = campaign.totalLeads > 0 ? Math.round((handled / campaign.totalLeads) * 100) : 0;
    const pending = campaign.totalLeads - handled;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <button 
                onClick={() => navigate('/campaigns')} 
                className="flex items-center text-sm font-bold text-gray-500 hover:text-vani-plum transition-colors"
            >
                <ChevronLeft size={16} className="mr-1" /> Back to Campaigns
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black dark:text-white tracking-tight">{campaign.name}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-gray-500 font-medium">Status:</span>
                        <Badge 
                            variant={campaign.status === 'completed' ? 'success' : campaign.status === 'paused' ? 'warning' : campaign.status === 'canceled' ? 'error' : 'default'}
                            className={campaign.status === 'running' ? 'bg-blue-500 text-white' : ''}
                        >
                            {campaign.status.toUpperCase()}
                        </Badge>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-3">
                    {campaign.status === 'running' && (
                        <Button variant="outline" onClick={() => handleControl('pause')} disabled={toggling}>
                            <Pause size={16} className="mr-2" /> Pause
                        </Button>
                    )}
                    {campaign.status === 'paused' && (
                        <Button className="bg-green-500 hover:bg-green-600 border-0 text-white" onClick={() => handleControl('resume')} disabled={toggling}>
                            <Play size={16} className="mr-2" /> Resume
                        </Button>
                    )}
                    {(campaign.status === 'running' || campaign.status === 'paused' || campaign.status === 'pending') && (
                        <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50" onClick={() => handleControl('cancel')} disabled={toggling}>
                            <StopCircle size={16} className="mr-2" /> Cancel
                        </Button>
                    )}
                </div>
            </div>

            {/* Progress Card */}
            <Card className="p-6 border-2">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold dark:text-white">Live Progress</h3>
                    <span className="text-sm font-bold text-vani-plum">{progress}%</span>
                </div>

                <div className="h-3 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mb-6">
                    <div
                        className={`h-full transition-all duration-500 ${campaign.status === 'canceled' ? 'bg-red-500' : 'vani-gradient'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-1 p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">Success</div>
                        <div className="text-2xl font-black dark:text-white">{campaign.completedLeads}</div>
                    </div>
                    <div className="space-y-1 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                        <div className="text-sm font-bold text-red-600 dark:text-red-400">Failed</div>
                        <div className="text-2xl font-black dark:text-white">{campaign.failedLeads}</div>
                    </div>
                    <div className="space-y-1 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                        <div className="text-sm font-bold text-gray-500">Pending</div>
                        <div className="text-2xl font-black dark:text-white">{pending}</div>
                    </div>
                </div>
            </Card>

            {/* Leads Table */}
            <Card className="p-0 border-2 overflow-hidden flex flex-col items-stretch">
                <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                    <h3 className="font-bold dark:text-white">Call Queue ({leads.length})</h3>
                    <Button variant="outline" size="sm" onClick={downloadFailures} disabled={campaign.failedLeads === 0}>
                        <Download size={14} className="mr-2" /> Download Failures
                    </Button>
                </div>
                
                <div className="max-h-[500px] overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="sticky top-0 bg-white dark:bg-vani-dark z-10 border-b border-gray-100 dark:border-white/10 uppercase text-xs font-black text-gray-400 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Call ID</th>
                                <th className="px-6 py-4 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {leads.map((lead) => (
                                <tr key={lead._id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-3 font-mono font-medium dark:text-white">{lead.to}</td>
                                    <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{lead.name || '—'}</td>
                                    <td className="px-6 py-3">
                                        {lead.status === 'completed' ? <span className="text-green-500 font-bold flex items-center gap-1"><CheckCircle size={14}/> Completed</span> :
                                         lead.status === 'failed' ? <span className="text-red-500 font-bold flex items-center gap-1"><AlertCircle size={14}/> Failed</span> :
                                         lead.status === 'calling' ? <span className="text-blue-500 font-bold flex items-center gap-1"><Loader2 size={14} className="animate-spin"/> Dialing</span> :
                                         <span className="text-gray-400 font-medium">Pending</span>}
                                    </td>
                                    <td className="px-6 py-3 font-mono text-xs text-gray-400">{lead.callSid?.slice(0, 16) || '—'}</td>
                                    <td className="px-6 py-3 text-right max-w-[150px] truncate text-xs">
                                        {lead.errorMessage ? <span className="text-red-500" title={lead.errorMessage}>{lead.errorMessage}</span> : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default CampaignDetails;

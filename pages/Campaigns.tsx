import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../components/UI';
import { Upload, Plus, Play, Pause, AlertCircle, BarChart3, Clock, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../lib/config';

type Campaign = {
    _id: string;
    name: string;
    status: string;
    concurrency: number;
    totalLeads: number;
    completedLeads: number;
    failedLeads: number;
    createdAt: string;
};

const Campaigns: React.FC = () => {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCampaigns = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('vani_access_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCampaigns(data);
            }
        } catch (error) {
            console.error('Failed to fetch campaigns', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
        // Poll every 10 seconds for listing overview status updates
        const interval = setInterval(fetchCampaigns, 10000);
        return () => clearInterval(interval);
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge variant="success"><CheckCircle size={12} className="mr-1" /> Completed</Badge>;
            case 'running': return <Badge className="bg-blue-500 text-white"><Play size={12} className="mr-1" /> Running</Badge>;
            case 'paused': return <Badge variant="warning"><Pause size={12} className="mr-1" /> Paused</Badge>;
            case 'canceled': return <Badge variant="error" className="bg-red-500 text-white"><AlertCircle size={12} className="mr-1" /> Canceled</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black dark:text-white tracking-tight">Campaigns</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Manage and track your bulk call operations
                    </p>
                </div>
                <Button onClick={() => navigate('/bulk-call')} className="h-12 px-6 shadow-lg shadow-vani-plum/20">
                    <Plus size={18} className="mr-2" /> New Campaign
                </Button>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-2xl" />
                    ))}
                </div>
            ) : campaigns.length === 0 ? (
                <Card className="p-12 text-center border-2 border-dashed">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Upload size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold dark:text-white mb-2">No campaigns yet</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                        Start your first bulk call operation by uploading a list of numbers.
                    </p>
                    <Button onClick={() => navigate('/bulk-call')}>Create Campaign</Button>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {campaigns.map(campaign => {
                        const handled = campaign.completedLeads + campaign.failedLeads;
                        const progress = campaign.totalLeads > 0 ? Math.round((handled / campaign.totalLeads) * 100) : 0;
                        
                        return (
                            <Card 
                                key={campaign._id} 
                                className="p-6 transition-all hover:shadow-lg hover:border-vani-plum/50 cursor-pointer"
                                onClick={() => navigate(`/campaigns/${campaign._id}`)}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-lg dark:text-white">{campaign.name}</h3>
                                            {getStatusBadge(campaign.status)}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} />
                                                <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <BarChart3 size={14} />
                                                <span>{campaign.totalLeads} total numbers</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full md:w-64 space-y-2">
                                        <div className="flex justify-between text-sm font-semibold dark:text-white">
                                            <span>Progress</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 ${campaign.status === 'canceled' ? 'bg-red-500' : 'vani-gradient'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span><span className="text-green-500 font-bold">{campaign.completedLeads}</span> success</span>
                                            <span><span className="text-red-500 font-bold">{campaign.failedLeads}</span> failed</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Campaigns;

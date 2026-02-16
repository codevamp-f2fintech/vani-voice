

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Input, Label, Badge } from '../components/UI';
import { Phone, Users, Loader2, PhoneCall, ArrowRight, RefreshCw, Cloud } from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import { useOutboundCall, validateE164 } from '../hooks/useOutboundCall';
import { api } from '../lib/api';

const TestCall: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedAgentId = searchParams.get('agentId');

    const [phoneNumber, setPhoneNumber] = useState('+91');
    const [selectedAgentId, setSelectedAgentId] = useState(preselectedAgentId || 'default');
    const [callResult, setCallResult] = useState<any>(null);
    const [showElevenLabsAgents, setShowElevenLabsAgents] = useState(true);
    const [elevenLabsAgents, setElevenLabsAgents] = useState<any[]>([]);
    const [loadingElevenLabs, setLoadingElevenLabs] = useState(false);

    const { agents, loading: agentsLoading } = useAgents();
    const { makeCall, loading: calling, error } = useOutboundCall();

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanPhone = phoneNumber.replace(/\s/g, '');
        if (!validateE164(cleanPhone)) {
            alert('Please enter a valid phone number in E.164 format (e.g., +918267818161)');
            return;
        }

        try {
            const result = await makeCall(cleanPhone, selectedAgentId);
            setCallResult(result);
        } catch (err) {
            // Error is handled by the hook
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-4xl font-black dark:text-white tracking-tight">Test Call</h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                    Make a single outbound call to test your Voice AI agent.
                </p>
            </div>

            <Card className="p-8 border-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Phone Number */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-base">
                            <Phone size={18} className="text-vani-plum" />
                            Phone Number
                        </Label>
                        <Input
                            type="tel"
                            placeholder="+91XXXXXXXXXX"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="h-14 text-lg font-medium"
                        />
                        <p className="text-xs text-gray-500">
                            Use E.164 format. Example: +918267818161
                        </p>
                    </div>

                    {/* Agent Source Toggle */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <Cloud size={20} className="text-blue-600" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                                {showElevenLabsAgents ? 'Showing Cloud Dashboard Agents' : 'Showing Local Database Agents'}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                {showElevenLabsAgents ? 'Includes V3 agents created in the cloud dashboard' : 'Only agents saved in your database'}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowElevenLabsAgents(!showElevenLabsAgents)}
                        >
                            {showElevenLabsAgents ? 'Switch to Local' : 'Switch to Cloud'}
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

                    {/* Agent Selection */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-base">
                            <Users size={18} className="text-vani-plum" />
                            Select Agent
                        </Label>
                        {(agentsLoading || loadingElevenLabs) ? (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 size={16} className="animate-spin" />
                                Loading agents...
                            </div>
                        ) : (
                            <select
                                value={selectedAgentId}
                                onChange={(e) => setSelectedAgentId(e.target.value)}
                                className="w-full h-14 px-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-base text-gray-900 dark:text-gray-100 outline-none focus:border-vani-plum focus:ring-2 focus:ring-vani-plum/20 font-medium transition-all"
                                style={{
                                    colorScheme: 'dark'
                                }}
                            >
                                <option value="default" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                                    Default Agent
                                </option>
                                {showElevenLabsAgents ? (
                                    // Show ElevenLabs agents
                                    elevenLabsAgents.map(agent => (
                                        <option
                                            key={agent.agent_id}
                                            value={agent.agent_id}
                                            className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                        >
                                            🌐 {agent.name || 'Unnamed Agent'} (Cloud)
                                        </option>
                                    ))
                                ) : (
                                    // Show local database agents
                                    activeAgents.map(agent => (
                                        <option
                                            key={agent._id}
                                            value={agent._id}
                                            className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                        >
                                            {agent.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {showElevenLabsAgents
                                ? `${elevenLabsAgents.length} cloud agents (including V3 models)`
                                : `${activeAgents.length} active agents from your database`
                            }
                        </p>
                    </div>



                    {/* Error Display */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Success Result */}
                    {callResult && (
                        <div className="p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                    <PhoneCall size={20} className="text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-green-800 dark:text-green-200">Call Initiated!</p>
                                    <p className="text-xs text-green-600 dark:text-green-400">Call ID: {callResult.id}</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full mt-2"
                                onClick={() => navigate('/call-logs')}
                            >
                                View Call Logs <ArrowRight size={16} className="ml-2" />
                            </Button>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <Button
                            type="submit"
                            className="flex-1 h-14 text-lg shadow-xl"
                            disabled={calling}
                        >
                            {calling ? (
                                <>
                                    <Loader2 size={20} className="mr-2 animate-spin" />
                                    Calling...
                                </>
                            ) : (
                                <>
                                    <Phone size={20} className="mr-2" />
                                    Make Call
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-14 px-8"
                            onClick={() => navigate('/call-logs')}
                        >
                            View Logs
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <Card
                    className="p-6 border-2 cursor-pointer hover:border-vani-plum/50 transition-all group"
                    onClick={() => navigate('/bulk-call')}
                >
                    <h3 className="font-bold dark:text-white mb-1 group-hover:text-vani-plum">Bulk Calls</h3>
                    <p className="text-sm text-gray-500">Upload a CSV to call multiple numbers</p>
                </Card>
                <Card
                    className="p-6 border-2 cursor-pointer hover:border-vani-plum/50 transition-all group"
                    onClick={() => navigate('/agents')}
                >
                    <h3 className="font-bold dark:text-white mb-1 group-hover:text-vani-plum">Manage Agents</h3>
                    <p className="text-sm text-gray-500">Create or edit your AI agents</p>
                </Card>
            </div>
        </div>
    );
};

export default TestCall;

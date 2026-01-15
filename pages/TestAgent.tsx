
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Input, Label, Badge } from '../components/UI';
import { Phone, Loader2, PhoneCall, ArrowLeft, ArrowRight, Mic, User } from 'lucide-react';
import { useAgent } from '../hooks/useAgents';
import { useOutboundCall, validateE164 } from '../hooks/useOutboundCall';

const TestAgent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { agent, loading: agentLoading, error: agentError } = useAgent(id || null);

    const [phoneNumber, setPhoneNumber] = useState('+91');
    const [callResult, setCallResult] = useState<any>(null);

    const { makeCall, loading: calling, error } = useOutboundCall();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanPhone = phoneNumber.replace(/\s/g, '');
        if (!validateE164(cleanPhone)) {
            alert('Please enter a valid phone number in E.164 format (e.g., +918267818161)');
            return;
        }

        try {
            const result = await makeCall(cleanPhone, id || 'default');
            setCallResult(result);
        } catch (err) {
            // Error is handled by the hook
        }
    };

    if (agentLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-vani-plum" />
            </div>
        );
    }

    if (agentError || !agent) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => navigate('/agents')} className="text-gray-500">
                    <ArrowLeft size={18} className="mr-2" /> Back to Agents
                </Button>
                <Card className="p-12 text-center">
                    <p className="text-red-500">{agentError || 'Agent not found'}</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/agents')} className="text-gray-500 p-2">
                    <ArrowLeft size={20} />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-black dark:text-white tracking-tight">Test Agent</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Make a test call with {agent.name}
                    </p>
                </div>
            </div>

            {/* Agent Info Card */}
            <Card className="p-6 border-2 border-vani-plum/20 bg-vani-plum/5">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-vani-plum/20 flex items-center justify-center text-vani-plum">
                        <User size={32} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-black dark:text-white">{agent.name}</h2>
                            <Badge variant={agent.status === 'active' ? 'success' : 'warning'}>{agent.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {agent.metadata?.description || 'No description provided'}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-400">
                            <span>Total Calls: {agent.statistics?.totalCalls || 0}</span>
                            <span>Success Rate: {agent.statistics?.totalCalls > 0
                                ? Math.round((agent.statistics.successfulCalls / agent.statistics.totalCalls) * 100)
                                : 0}%</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Call Form */}
            <Card className="p-8 border-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Phone Number */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-base">
                            <Phone size={18} className="text-vani-plum" />
                            Phone Number to Call
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
                            disabled={calling || agent.status !== 'active'}
                        >
                            {calling ? (
                                <>
                                    <Loader2 size={20} className="mr-2 animate-spin" />
                                    Calling...
                                </>
                            ) : (
                                <>
                                    <Phone size={20} className="mr-2" />
                                    Make Test Call
                                </>
                            )}
                        </Button>
                    </div>

                    {agent.status !== 'active' && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                            This agent is not active. Please activate it before making test calls.
                        </p>
                    )}
                </form>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <Card
                    className="p-6 border-2 cursor-pointer hover:border-vani-plum/50 transition-all group"
                    onClick={() => navigate(`/agents/${id}/edit`)}
                >
                    <h3 className="font-bold dark:text-white mb-1 group-hover:text-vani-plum">Edit Agent</h3>
                    <p className="text-sm text-gray-500">Modify this agent's settings</p>
                </Card>
                <Card
                    className="p-6 border-2 cursor-pointer hover:border-vani-plum/50 transition-all group"
                    onClick={() => navigate('/call-logs')}
                >
                    <h3 className="font-bold dark:text-white mb-1 group-hover:text-vani-plum">View Call Logs</h3>
                    <p className="text-sm text-gray-500">See all call history</p>
                </Card>
            </div>
        </div>
    );
};

export default TestAgent;

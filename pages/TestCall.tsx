
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Input, Label, Badge } from '../components/UI';
import { Phone, Users, Loader2, PhoneCall, ArrowRight } from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import { useOutboundCall, validateE164 } from '../hooks/useOutboundCall';

const TestCall: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedAgentId = searchParams.get('agentId');

    const [phoneNumber, setPhoneNumber] = useState('+91');
    const [selectedAgentId, setSelectedAgentId] = useState(preselectedAgentId || 'default');
    const [callResult, setCallResult] = useState<any>(null);

    const { agents, loading: agentsLoading } = useAgents();
    const { makeCall, loading: calling, error } = useOutboundCall();

    const activeAgents = agents.filter(a => a.status === 'active');

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

                    {/* Agent Selection */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-base">
                            <Users size={18} className="text-vani-plum" />
                            Select Agent
                        </Label>
                        {agentsLoading ? (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 size={16} className="animate-spin" />
                                Loading agents...
                            </div>
                        ) : (
                            <select
                                value={selectedAgentId}
                                onChange={(e) => setSelectedAgentId(e.target.value)}
                                className="w-full h-14 px-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-xl text-base dark:text-white outline-none focus:border-vani-plum font-medium"
                            >
                                <option value="default">Default Agent</option>
                                {activeAgents.map(agent => (
                                    <option key={agent._id} value={agent._id}>
                                        {agent.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <p className="text-xs text-gray-500">
                            Select a custom agent or use the default one.
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

// Enhanced Test Call Page - Uses Independent Voice Pipeline
// No VAPI dependency!

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Input, Label, Badge } from '../components/UI';
import { Phone, Users, Loader2, PhoneCall, ArrowRight, Zap } from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import { useIndependentCall } from '../hooks/useIndependentCall';

// E.164 phone number validation
function validateE164(phone: string): boolean {
    return /^\+[1-9]\d{1,14}$/.test(phone);
}

const TestCall: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedAgentId = searchParams.get('agentId');

    const [phoneNumber, setPhoneNumber] = useState('+91');
    const [selectedAgentId, setSelectedAgentId] = useState(preselectedAgentId || '');
    const [variableName, setVariableName] = useState('');
    const [callResult, setCallResult] = useState<any>(null);

    const { agents, loading: agentsLoading } = useAgents();
    const { makeCall, calling, error } = useIndependentCall();

    const activeAgents = agents.filter(a => a.status === 'active');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanPhone = phoneNumber.replace(/\s/g, '');
        if (!validateE164(cleanPhone)) {
            alert('Please enter a valid phone number in E.164 format (e.g., +918267818161)');
            return;
        }

        if (!selectedAgentId) {
            alert('Please select an agent');
            return;
        }

        try {
            // Build variables object if name is provided
            const variables = variableName.trim() ? { name: variableName.trim() } : undefined;
            const result = await makeCall(cleanPhone, selectedAgentId, variables);
            setCallResult(result);
        } catch (err: any) {
            // Error handled by hook
            console.error('Call error:', err);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-black dark:text-white tracking-tight">Test Call</h1>
                    <Badge className="bg-gradient-to-r from-vani-plum to-vani-pink text-white px-3 py-1 text-xs font-bold">
                        <Zap size={12} className="mr-1" />
                        Independent
                    </Badge>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                    Make a single outbound call using your independent voice AI pipeline (no VAPI!)
                </p>
            </div>

            {/* Main Form */}
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
                            required
                        />
                        <p className="text-xs text-gray-500">
                            Use E.164 format. Example: +918267818161
                        </p>
                    </div>

                    {/* Variable (Name) */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-base">
                            <Zap size={18} className="text-vani-plum" />
                            Name Variable
                            <span className="text-xs text-gray-400 font-normal">(optional)</span>
                        </Label>
                        <Input
                            type="text"
                            placeholder="e.g. Talha"
                            value={variableName}
                            onChange={(e) => setVariableName(e.target.value)}
                            className="h-14 text-lg font-medium"
                        />
                        <p className="text-xs text-gray-500">
                            Use <code className="bg-gray-100 dark:bg-white/10 px-1 rounded text-vani-plum">{'{{name}}'}</code> in your agent's first message. This value will replace it at call time.
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
                        ) : activeAgents.length === 0 ? (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-yellow-800 dark:text-yellow-400 text-sm">
                                No active agents found. <button type="button" onClick={() => navigate('/agents/create')} className="underline font-bold">Create one first</button>
                            </div>
                        ) : (
                            <select
                                value={selectedAgentId}
                                onChange={(e) => setSelectedAgentId(e.target.value)}
                                className="w-full h-14 px-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-xl text-base dark:text-white outline-none focus:border-vani-plum font-medium"
                                required
                            >
                                <option value="">-- Select Agent --</option>
                                {activeAgents.map(agent => (
                                    <option key={agent._id} value={agent._id}>
                                        {agent.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <p className="text-xs text-gray-500">
                            Select which AI agent will handle this call
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
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        Call ID: {callResult.sid || callResult.id}
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        Agent: {callResult.agentName}
                                    </p>
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
                            disabled={calling || !selectedAgentId}
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
                    onClick={() => navigate('/agents/create')}
                >
                    <h3 className="font-bold dark:text-white mb-1 group-hover:text-vani-plum">Create Agent</h3>
                    <p className="text-sm text-gray-500">Build a new AI voice agent</p>
                </Card>
            </div>

            {/* Info Card */}
            <Card className="p-6 bg-gradient-to-r from-vani-plum/10 to-vani-pink/10 border-2 border-vani-plum/20">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-vani-plum/20 flex items-center justify-center flex-shrink-0">
                        <Zap size={20} className="text-vani-plum" />
                    </div>
                    <div>
                        <h3 className="font-bold dark:text-white mb-1">Independent Voice Pipeline</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            This uses your own voice AI infrastructure with Deepgram (STT), Gemini AI (LLM),
                            and ElevenLabs (TTS) - no VAPI dependency! Enjoy 77% cost savings and complete control.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default TestCall;

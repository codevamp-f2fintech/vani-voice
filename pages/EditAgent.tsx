
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Input, Label, Badge } from '../components/UI';
import {
    ChevronLeft,
    Save,
    Settings2,
    Volume2,
    MessageSquare,
    Loader2,
    Upload,
    Info,
    ArrowLeft
} from 'lucide-react';
import { useVoices } from '../hooks/useVoices';
import { useAgent, updateAgent } from '../hooks/useAgents';
import { uploadFile } from '../hooks/useFiles';

const EditAgent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { agent, loading: agentLoading, error: agentError } = useAgent(id || null);
    const { voices, loading: voicesLoading } = useVoices();

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [agentName, setAgentName] = useState('');
    const [language, setLanguage] = useState('Hindi');
    const [goal, setGoal] = useState('');
    const [selectedVoiceId, setSelectedVoiceId] = useState('');
    const [llmModel, setLlmModel] = useState('gpt-4o');
    const [temperature, setTemperature] = useState(0.7);
    const [voiceSpeed, setVoiceSpeed] = useState(1.0);
    const [firstMessage, setFirstMessage] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [status, setStatus] = useState<'active' | 'inactive' | 'draft'>('active');

    // Pre-populate form when agent data loads
    useEffect(() => {
        if (agent) {
            setAgentName(agent.name || '');
            setGoal(agent.metadata?.description || '');
            setStatus(agent.status || 'active');

            // Load configuration if available
            if (agent.configuration) {
                const config = agent.configuration;
                setSelectedVoiceId(config.voice?.voiceId || '');
                setLlmModel(config.model?.model || 'gpt-4o');
                setTemperature(config.model?.temperature ?? 0.7);
                setFirstMessage(config.firstMessage || '');
                setSystemPrompt(config.model?.systemPrompt || '');
            }

            // Extract language from tags
            if (agent.metadata?.tags?.length) {
                const langTag = agent.metadata.tags[0];
                setLanguage(langTag.charAt(0).toUpperCase() + langTag.slice(1));
            }
        }
    }, [agent]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const result = await uploadFile(file);
            if (result.success && result.file) {
                setUploadedFileId(result.file.id);
            }
        } catch (err: any) {
            alert(err.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveAgent = async () => {
        if (!agentName.trim()) {
            alert('Please enter an agent name');
            return;
        }

        if (!id) return;

        try {
            setSaving(true);

            const updates = {
                name: agentName,
                status,
                voice: selectedVoiceId ? {
                    voiceId: selectedVoiceId,
                    provider: voices.find(v => v.voiceId === selectedVoiceId)?.provider || 'deepgram'
                } : undefined,
                model: {
                    provider: 'openai',
                    model: llmModel,
                    temperature,
                    systemPrompt
                },
                firstMessage,
                metadata: {
                    description: goal,
                    category: 'general',
                    tags: [language.toLowerCase()],
                    createdBy: 'vani-dashboard'
                }
            };

            const result = await updateAgent(id, updates);

            if (result.success) {
                navigate('/agents');
            }
        } catch (err: any) {
            alert(err.message || 'Failed to update agent');
        } finally {
            setSaving(false);
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
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/agents')} className="text-gray-500 p-2">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black dark:text-white tracking-tight">Edit Agent</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                            Modify {agent.name}'s configuration
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Badge variant={status === 'active' ? 'success' : status === 'draft' ? 'warning' : 'default'}>
                        {status}
                    </Badge>
                    <select
                        className="px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
            </div>

            <Card className="p-10 shadow-2xl border-2">
                {/* Basics Section */}
                <div className="space-y-8 mb-12">
                    <div className="flex items-center gap-3 text-vani-plum">
                        <Settings2 size={24} />
                        <h2 className="text-xl font-black dark:text-white">Agent Basics</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label>Agent Name</Label>
                            <Input
                                placeholder="e.g. HealthKart Assistant"
                                className="h-14 text-lg"
                                value={agentName}
                                onChange={(e) => setAgentName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-3">
                            <Label>Language Selection</Label>
                            <select
                                className="w-full px-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-base dark:text-white focus:ring-4 focus:ring-vani-plum/20 outline-none font-medium"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                <option>English (Indian Accent)</option>
                                <option>Hindi</option>
                                <option>Hinglish (Mixed)</option>
                                <option>Tamil</option>
                                <option>Telugu</option>
                                <option>Marathi</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <Label>What is this agent's core goal?</Label>
                            <textarea
                                className="w-full h-32 px-6 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-base dark:text-white focus:ring-4 focus:ring-vani-plum/20 outline-none resize-none font-medium leading-relaxed"
                                placeholder="e.g. Help customers book dental appointments..."
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Voice & Model Section */}
                <div className="space-y-8 mb-12 pt-8 border-t border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-3 text-vani-plum">
                        <Volume2 size={24} />
                        <h2 className="text-xl font-black dark:text-white">Voice & Model</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label>Voice Model Selection</Label>
                                {voicesLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-vani-plum" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                                        {voices.slice(0, 8).map(v => (
                                            <button
                                                key={v.voiceId}
                                                onClick={() => setSelectedVoiceId(v.voiceId)}
                                                className={`p-4 text-left border-2 rounded-2xl transition-all ${selectedVoiceId === v.voiceId ? 'border-vani-plum bg-vani-plum/5 shadow-lg' : 'border-gray-100 dark:border-white/5 hover:border-vani-plum/40'}`}
                                            >
                                                <p className={`text-xs font-black uppercase tracking-widest ${selectedVoiceId === v.voiceId ? 'text-vani-plum' : 'text-gray-400'}`}>{v.provider}</p>
                                                <p className={`text-sm font-bold mt-1 ${selectedVoiceId === v.voiceId ? 'dark:text-white' : 'dark:text-gray-400'}`}>{v.name}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <Label>LLM Engine</Label>
                                <select
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl text-base dark:text-white outline-none font-bold"
                                    value={llmModel}
                                    onChange={(e) => setLlmModel(e.target.value)}
                                >
                                    <option value="gpt-4o">GPT-4o (Premium Performance)</option>
                                    <option value="gpt-4o-mini">GPT-4o mini (Low Latency)</option>
                                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-8 bg-gray-50 dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Label className="mb-0">Creativity (Temp)</Label>
                                        <Info size={14} className="text-gray-400" />
                                    </div>
                                    <span className="text-lg text-vani-plum font-black">{temperature.toFixed(1)}</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.1"
                                    value={temperature}
                                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full appearance-none accent-vani-plum cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                    <span>Precise</span>
                                    <span>Creative</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="mb-0">Speaking Speed</Label>
                                    <span className="text-lg text-vani-plum font-black">{voiceSpeed.toFixed(1)}x</span>
                                </div>
                                <input
                                    type="range" min="0.5" max="2.0" step="0.1"
                                    value={voiceSpeed}
                                    onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full appearance-none accent-vani-plum cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                    <span>Slow</span>
                                    <span>Fast</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Prompting Section */}
                <div className="space-y-8 pt-8 border-t border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-3 text-vani-plum">
                        <MessageSquare size={24} />
                        <h2 className="text-xl font-black dark:text-white">Prompting</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label>First Message Prompt</Label>
                            <Input
                                placeholder="e.g. Namaste! How can I help you today?"
                                className="h-14 text-lg font-medium border-2 focus:border-vani-plum"
                                value={firstMessage}
                                onChange={(e) => setFirstMessage(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 font-medium italic">This is the very first sentence the agent says when a call connects.</p>
                        </div>

                        <div className="space-y-3">
                            <Label>System Instructions (The "Brain")</Label>
                            <textarea
                                className="w-full h-48 px-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl text-sm font-mono dark:text-gray-300 outline-none focus:border-vani-plum transition-all leading-relaxed"
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                            />
                        </div>

                        <div
                            className="p-6 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl flex items-center gap-4 group cursor-pointer hover:border-vani-plum hover:bg-vani-plum/5 duration-500"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.txt,.doc,.docx,.csv"
                                onChange={handleFileUpload}
                            />
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-vani-plum group-hover:text-white transition-all">
                                {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                            </div>
                            <div>
                                <p className="font-bold dark:text-white">
                                    {uploadedFileId ? 'File Uploaded ✓' : uploading ? 'Uploading...' : 'Upload Knowledge Base (RAG)'}
                                </p>
                                <p className="text-xs text-gray-500">PDF, TXT or CSV supported</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-12 pt-8 flex items-center justify-between border-t border-gray-100 dark:border-white/5">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/agents')}
                        className="text-gray-500 font-bold h-14 px-8"
                    >
                        <ChevronLeft size={20} className="mr-2" /> Cancel
                    </Button>

                    <Button
                        onClick={handleSaveAgent}
                        disabled={saving}
                        className="h-14 px-10 text-lg shadow-xl"
                    >
                        {saving ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default EditAgent;

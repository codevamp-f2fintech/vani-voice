import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Input, Label, Badge } from '../components/UI';
import {
  ArrowLeft,
  Save,
  Loader2,
  Settings2,
  Volume2,
  MessageSquare,
  Mic,
  Phone,
  FileText,
  Zap,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import { useVoices } from '../hooks/useVoices';
import { createAgent, updateAgent, useAgent } from '../hooks/useAgents';
import { uploadFile } from '../hooks/useFiles';
import VoiceSelect from '../components/VoiceSelect';

interface UploadedFile {
  id: string;
  name: string;
  status: string;
  bytes?: number;
}

const CreateAgentWizard: React.FC = () => {
  const navigate = useNavigate();
  const { id: agentId } = useParams<{ id: string }>();
  const isEditMode = !!agentId;

  const { agent: existingAgent, loading: agentLoading } = useAgent(agentId || null);

  const [activeTab, setActiveTab] = useState('basics');
  const [saving, setSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual voice ID state
  const [addVoiceManually, setAddVoiceManually] = useState(false);
  const [manualVoiceId, setManualVoiceId] = useState('');

  // Form state - comprehensive configuration
  const [formData, setFormData] = useState({
    // Basic
    name: '',
    description: '',
    category: 'other',
    tags: '',
    status: 'active' as 'active' | 'inactive' | 'draft',

    // Model configuration
    modelProvider: 'openai',
    modelName: 'gpt-4o',
    systemPrompt: `You are a helpful Voice AI Assistant for Bharat.
- Tone: Helpful, empathetic, and professional.
- Language: Primary Hindi with English technical terms.
- Task: Help users with their queries efficiently.`,
    temperature: 0.7,
    maxTokens: 500,

    // Voice configuration
    voiceProvider: '11labs',
    voiceId: '',
    voiceModel: 'eleven_turbo_v2_5',

    // Transcriber configuration
    transcriberProvider: 'deepgram',
    transcriberModel: 'nova-2',
    language: 'hi',

    // First message
    firstMessage: 'Namaste! Main aapki kaise madad kar sakti hoon?',
    firstMessageMode: 'assistant-speaks-first',

    // Advanced settings
    maxDurationSeconds: 600,
    silenceTimeoutSeconds: 30,
    responseDelaySeconds: 0.4,
  });

  // Fetch voices
  const { voices, loading: voicesLoading } = useVoices();

  // Pre-populate form when editing
  useEffect(() => {
    if (isEditMode && existingAgent && !dataLoaded) {
      console.log('Loading agent data for edit:', existingAgent);

      const config = existingAgent.configuration || {};

      setFormData(prev => ({
        ...prev,
        name: existingAgent.name || '',
        description: existingAgent.metadata?.description || '',
        category: existingAgent.metadata?.category || 'other',
        tags: existingAgent.metadata?.tags?.join(', ') || '',
        status: existingAgent.status || 'active',

        // Model
        modelProvider: config.model?.provider || 'openai',
        modelName: config.model?.model || 'gpt-4o',
        systemPrompt: config.model?.messages?.[0]?.content || config.model?.systemPrompt || prev.systemPrompt,
        temperature: config.model?.temperature ?? 0.7,
        maxTokens: config.model?.maxTokens ?? 500,

        // Voice
        voiceProvider: config.voice?.provider || '11labs',
        voiceId: config.voice?.voiceId || '',
        voiceModel: config.voice?.model || 'eleven_turbo_v2_5',

        // Transcriber
        transcriberProvider: config.transcriber?.provider || 'deepgram',
        transcriberModel: config.transcriber?.model || 'nova-2',
        language: config.transcriber?.language || 'hi',

        // First message
        firstMessage: config.firstMessage || prev.firstMessage,
        firstMessageMode: config.firstMessageMode || 'assistant-speaks-first',

        // Advanced
        maxDurationSeconds: config.maxDurationSeconds ?? 600,
        silenceTimeoutSeconds: config.silenceTimeoutSeconds ?? 30,
        responseDelaySeconds: config.responseDelaySeconds ?? 0.4,
      }));

      setDataLoaded(true);
    }
  }, [existingAgent, isEditMode, dataLoaded]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const result = await uploadFile(file);
      if (result.success && result.file) {
        setUploadedFiles(prev => [...prev, {
          id: result.file.id,
          name: result.file.name || file.name,
          status: result.file.status || 'uploaded',
          bytes: result.file.bytes
        }]);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Please enter an agent name');
      return;
    }

    const finalVoiceId = addVoiceManually ? manualVoiceId : formData.voiceId;

    try {
      setSaving(true);

      // Build VAPI configuration
      const vapiConfig: any = {
        name: formData.name,
        model: {
          provider: formData.modelProvider,
          model: formData.modelName,
          messages: [{ role: 'system', content: formData.systemPrompt }],
          temperature: parseFloat(formData.temperature as any),
          maxTokens: parseInt(formData.maxTokens as any),
        },
        voice: finalVoiceId ? {
          provider: formData.voiceProvider,
          voiceId: finalVoiceId,
          model: formData.voiceModel,
          stability: 0.5,
          similarityBoost: 0.75,
        } : undefined,
        transcriber: {
          provider: formData.transcriberProvider,
          model: formData.transcriberModel,
          language: formData.language,
        },
        firstMessage: formData.firstMessage,
        firstMessageMode: formData.firstMessageMode,
        maxDurationSeconds: parseInt(formData.maxDurationSeconds as any),
        silenceTimeoutSeconds: parseInt(formData.silenceTimeoutSeconds as any),
        responseDelaySeconds: parseFloat(formData.responseDelaySeconds as any),
      };

      // Add knowledge base if files uploaded
      if (uploadedFiles.length > 0) {
        vapiConfig.model.knowledgeBase = {
          provider: 'google',
          fileIds: uploadedFiles.map(f => f.id)
        };
      }

      let result;
      if (isEditMode && agentId) {
        const updatePayload = {
          name: formData.name,
          status: formData.status,
          configuration: vapiConfig,
          metadata: {
            description: formData.description,
            category: formData.category,
            tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
            createdBy: 'vani-dashboard'
          }
        };
        result = await updateAgent(agentId, updatePayload);
      } else {
        const createPayload = {
          ...vapiConfig,
          status: 'active',
          metadata: {
            description: formData.description,
            category: formData.category,
            tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
            createdBy: 'vani-dashboard'
          }
        };
        result = await createAgent(createPayload);
      }

      if (result.success) {
        navigate('/agents');
      }
    } catch (err: any) {
      alert(err.message || `Failed to ${isEditMode ? 'update' : 'create'} agent`);
    } finally {
      setSaving(false);
    }
  };

  if (isEditMode && agentLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-vani-plum" />
      </div>
    );
  }

  const tabs = [
    { id: 'basics', label: 'Basics', icon: Settings2 },
    { id: 'model', label: 'Model', icon: MessageSquare },
    { id: 'voice', label: 'Voice', icon: Volume2 },
    { id: 'transcriber', label: 'Transcriber', icon: Mic },
    { id: 'knowledge', label: 'Knowledge', icon: FileText },
    { id: 'advanced', label: 'Advanced', icon: Zap },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/agents')} className="text-gray-500 p-2">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-black dark:text-white tracking-tight">
            {isEditMode ? 'Edit Agent' : 'Create New Agent'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isEditMode ? `Modify ${existingAgent?.name || 'agent'} configuration` : 'Configure your voice agent with custom settings'}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-white dark:bg-vani-dark text-vani-plum shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Card className="p-6">
        {/* Basics Tab */}
        {activeTab === 'basics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold dark:text-white">Basic Information</h3>

            <div className="space-y-2">
              <Label>Agent Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Customer Support Agent"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe what this agent does..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-vani-plum/20 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-vani-plum/20 outline-none"
                >
                  <option value="customer-support">Customer Support</option>
                  <option value="sales">Sales</option>
                  <option value="appointment">Appointment</option>
                  <option value="survey">Survey</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder="support, hindi, v1"
                  className="h-12"
                />
              </div>
            </div>

            {isEditMode && (
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-vani-plum/20 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Model Tab */}
        {activeTab === 'model' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold dark:text-white">Model Configuration</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Model Provider</Label>
                <select
                  value={formData.modelProvider}
                  onChange={(e) => handleChange('modelProvider', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-vani-plum/20 outline-none"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="groq">Groq</option>
                  <option value="together-ai">Together AI</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Model Name</Label>
                <Input
                  value={formData.modelName}
                  onChange={(e) => handleChange('modelName', e.target.value)}
                  placeholder="gpt-4o"
                  className="h-12"
                />
                <p className="text-xs text-gray-500">Examples: gpt-4o, gpt-4, claude-3-opus</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>System Prompt</Label>
              <textarea
                value={formData.systemPrompt}
                onChange={(e) => handleChange('systemPrompt', e.target.value)}
                rows={6}
                placeholder="You are a helpful assistant..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-vani-plum/20 outline-none resize-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Temperature ({formData.temperature})</Label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                  className="w-full accent-vani-plum"
                />
                <p className="text-xs text-gray-500">Lower = more focused, Higher = more creative</p>
              </div>
              <div className="space-y-2">
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  value={formData.maxTokens}
                  onChange={(e) => handleChange('maxTokens', e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          </div>
        )}

        {/* Voice Tab */}
        {activeTab === 'voice' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold dark:text-white">Voice Configuration</h3>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select a voice from the list, or enable custom voice to enter a Voice ID manually.
            </p>

            {formData.language === 'hi' && (
              <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-xl">
                <AlertCircle size={16} />
                You are using Hindi language. Make sure to choose a voice compatible with Hindi.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Voice Provider</Label>
                <select
                  value={formData.voiceProvider}
                  onChange={(e) => handleChange('voiceProvider', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-vani-plum/20 outline-none"
                >
                  <option value="11labs">ElevenLabs</option>
                  <option value="azure">Azure</option>
                  <option value="playht">PlayHT</option>
                  <option value="deepgram">Deepgram</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Voice Model</Label>
                <select
                  value={formData.voiceModel}
                  onChange={(e) => handleChange('voiceModel', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-vani-plum/20 outline-none"
                >
                  <option value="eleven_turbo_v2_5">eleven_turbo_v2_5</option>
                  <option value="eleven_turbo_v2">eleven_turbo_v2</option>
                  <option value="eleven_multilingual_v2">eleven_multilingual_v2</option>
                  <option value="eleven_monolingual_v1">eleven_monolingual_v1</option>
                </select>
              </div>
            </div>

            {/* Voice Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Voice Selection</Label>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addVoiceManually}
                    onChange={(e) => {
                      setAddVoiceManually(e.target.checked);
                      if (!e.target.checked) setManualVoiceId('');
                    }}
                    className="accent-vani-plum"
                  />
                  Add Voice ID Manually
                </label>
              </div>

              {addVoiceManually ? (
                <div className="space-y-2">
                  <Input
                    value={manualVoiceId}
                    onChange={(e) => setManualVoiceId(e.target.value)}
                    placeholder="Enter ElevenLabs Voice ID"
                    className="h-12"
                  />
                  <p className="text-xs text-gray-500">
                    Enter the Voice ID from your ElevenLabs account
                  </p>
                </div>
              ) : voicesLoading ? (
                <div className="flex items-center gap-2 h-12 px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500">
                  <Loader2 size={16} className="animate-spin" />
                  Loading voices...
                </div>
              ) : (
                <VoiceSelect
                  voices={voices}
                  selectedVoiceId={formData.voiceId}
                  onSelect={(voiceId) => handleChange('voiceId', voiceId)}
                />
              )}
            </div>
          </div>
        )}

        {/* Transcriber Tab */}
        {activeTab === 'transcriber' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold dark:text-white">Transcriber Configuration</h3>

            <div className="space-y-2">
              <Label>Transcriber Provider</Label>
              <select
                value={formData.transcriberProvider}
                onChange={(e) => handleChange('transcriberProvider', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-vani-plum/20 outline-none"
              >
                <option value="deepgram">Deepgram</option>
                <option value="assembly-ai">AssemblyAI</option>
                <option value="gladia">Gladia</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={formData.transcriberModel}
                  onChange={(e) => handleChange('transcriberModel', e.target.value)}
                  placeholder="nova-2"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <select
                  value={formData.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-vani-plum/20 outline-none"
                >
                  <option value="hi">Hindi</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                  <option value="mr">Marathi</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Knowledge Tab */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold dark:text-white">Knowledge Base</h3>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload files to give your agent custom knowledge. Supported formats: PDF, TXT, DOCX, CSV, MD, JSON
            </p>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-8 text-center hover:border-vani-plum transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.txt,.docx,.doc,.csv,.md,.json,.xml"
                onChange={handleFileUpload}
                disabled={uploadingFile}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 w-full"
                disabled={uploadingFile}
              >
                {uploadingFile ? (
                  <>
                    <Loader2 size={32} className="text-vani-plum animate-spin" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-gray-400">
                      PDF, TXT, DOCX, CSV, MD, JSON (max 10MB)
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files</Label>
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-vani-plum" />
                      <div>
                        <p className="text-sm font-medium dark:text-white">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {file.bytes ? `${(file.bytes / 1024).toFixed(1)} KB` : 'Processing...'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded"
                    >
                      <X size={16} className="text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold dark:text-white">Advanced Settings</h3>

            <div className="space-y-2">
              <Label>First Message</Label>
              <textarea
                value={formData.firstMessage}
                onChange={(e) => handleChange('firstMessage', e.target.value)}
                rows={3}
                placeholder="Hello! How can I help you today?"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-vani-plum/20 outline-none resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>First Message Mode</Label>
              <select
                value={formData.firstMessageMode}
                onChange={(e) => handleChange('firstMessageMode', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-vani-plum/20 outline-none"
              >
                <option value="assistant-speaks-first">Assistant Speaks First</option>
                <option value="assistant-waits-for-user">Wait for User</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Max Duration (sec)</Label>
                <Input
                  type="number"
                  value={formData.maxDurationSeconds}
                  onChange={(e) => handleChange('maxDurationSeconds', e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Silence Timeout (sec)</Label>
                <Input
                  type="number"
                  value={formData.silenceTimeoutSeconds}
                  onChange={(e) => handleChange('silenceTimeoutSeconds', e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Response Delay (sec)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.responseDelaySeconds}
                  onChange={(e) => handleChange('responseDelaySeconds', e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={() => navigate('/agents')}
          disabled={saving}
          className="h-12 px-6"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="h-12 px-8 shadow-xl"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              {isEditMode ? 'Saving...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save size={18} className="mr-2" />
              {isEditMode ? 'Save Changes' : 'Create Agent'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateAgentWizard;

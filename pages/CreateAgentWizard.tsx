import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import { usePhoneNumbers } from '../hooks/usePhoneNumbers';
import VoiceSelect from '../components/VoiceSelect';

interface UploadedFile {
  id: string;
  name: string;
  text: string;         // Extracted plain text used for Gemini injection
  s3Url?: string;       // S3 archive URL (optional)
  status: string;
  bytes?: number;
}

const CreateAgentWizard: React.FC = () => {
  const navigate = useNavigate();
  const { id: agentId } = useParams<{ id: string }>();
  const isEditMode = !!agentId;
  const location = useLocation();

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
    voiceSpeed: 0.85, // 0.5-2.0, lower = slower
    hinglish: false, // Hinglish mode for Hindi+English mixed speech

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

    // Phone number selection
    phoneNumberId: '',
  });

  // Fetch voices
  const { voices, loading: voicesLoading } = useVoices();

  // Fetch phone numbers
  const { phoneNumbers } = usePhoneNumbers();
  console.log('[CreateAgentWizard] phoneNumbers:', phoneNumbers);
  console.log('[CreateAgentWizard] Twilio numbers:', phoneNumbers?.filter(pn => pn.provider === 'twilio'));

  // Pre-populate form when editing or using template
  useEffect(() => {
    // Handle Template Configuration
    if (!isEditMode && location.state?.templateConfig && !dataLoaded) {
      console.log('Loading template config:', location.state.templateConfig);
      const template = location.state.templateConfig;

      setFormData(prev => ({
        ...prev,
        // Basic
        name: template.name || prev.name,
        description: template.description || prev.description,
        category: template.category || prev.category,
        tags: template.tags || prev.tags,

        // Model
        modelProvider: template.modelProvider || prev.modelProvider,
        modelName: template.modelName || prev.modelName,
        systemPrompt: template.systemPrompt || prev.systemPrompt,
        temperature: template.temperature ?? prev.temperature,
        maxTokens: template.maxTokens ?? prev.maxTokens,

        // Voice
        voiceProvider: template.voiceProvider || prev.voiceProvider,
        voiceId: template.voiceId || prev.voiceId,
        voiceModel: template.voiceModel || prev.voiceModel,
        voiceSpeed: template.voiceSpeed ?? prev.voiceSpeed,

        // Transcriber
        transcriberProvider: template.transcriberProvider || prev.transcriberProvider,
        transcriberModel: template.transcriberModel || prev.transcriberModel,
        language: template.language || prev.language,

        // First Message
        firstMessage: template.firstMessage || prev.firstMessage,
        firstMessageMode: template.firstMessageMode || prev.firstMessageMode,

        // Advanced
        maxDurationSeconds: template.maxDurationSeconds ?? prev.maxDurationSeconds,
        silenceTimeoutSeconds: template.silenceTimeoutSeconds ?? prev.silenceTimeoutSeconds,
        responseDelaySeconds: template.responseDelaySeconds ?? prev.responseDelaySeconds,
      }));

      // If voice ID is provided in template, ensure manual mode is checked if it's not in the list (simplified logic)
      if (template.voiceId) {
        // We'll trust the template has a valid voice ID
        // Ideally we check against 'voices' list once loaded, but for now just setting it works
      }

      setDataLoaded(true);
      return;
    }

    // Handle Edit Mode
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
        voiceSpeed: config.voice?.speed ?? 0.85,
        hinglish: config.voice?.hinglish ?? false,

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

        // Phone number
        phoneNumberId: existingAgent.phoneNumberId || '',
      }));
      console.log('[CreateAgentWizard] Loaded phoneNumberId from agent:', existingAgent.phoneNumberId);

      // Pre-populate KB files from saved agent config
      if (config.knowledgeBase && Array.isArray(config.knowledgeBase) && config.knowledgeBase.length > 0) {
        setUploadedFiles(config.knowledgeBase.map((f: any) => ({
          id: f.id,
          name: f.name,
          text: f.text || '',
          s3Url: f.s3Url,
          status: 'uploaded',
          bytes: f.bytes
        })));
      }

      setDataLoaded(true);
    }
  }, [existingAgent, isEditMode, dataLoaded, location.state]);

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
          text: result.file.text || '',      // extracted text for Gemini
          s3Url: result.file.s3Url,          // S3 archive URL
          status: result.file.status || 'processed',
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
          // V3 models don't support voice settings (stability, speed, similarity)
          ...(!['eleven_v3', 'eleven_ttv_v3'].includes(formData.voiceModel) ? {
            stability: 0.5,
            similarityBoost: 0.75,
            speed: formData.voiceSpeed,
          } : {}),
          hinglish: formData.hinglish,
          language: formData.language,
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

      // Add knowledge base if files uploaded (store full text for Gemini injection)
      if (uploadedFiles.length > 0) {
        vapiConfig.knowledgeBase = uploadedFiles.map(f => ({
          id: f.id,
          name: f.name,
          text: f.text,
          s3Url: f.s3Url
        }));
      }

      let result;
      if (isEditMode && agentId) {
        const updatePayload: any = {
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

        // Add phoneNumberId if selected
        if (formData.phoneNumberId) {
          updatePayload.phoneNumberId = formData.phoneNumberId;
        }

        console.log('[CreateAgentWizard] Updating agent with payload:', updatePayload);
        console.log('[CreateAgentWizard] phoneNumberId being sent:', formData.phoneNumberId);

        result = await updateAgent(agentId, updatePayload);
      } else {
        const createPayload: any = {
          ...vapiConfig,
          status: 'active',
          metadata: {
            description: formData.description,
            category: formData.category,
            tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
            createdBy: 'vani-dashboard'
          }
        };

        // Add phoneNumberId if selected
        if (formData.phoneNumberId) {
          createPayload.phoneNumberId = formData.phoneNumberId;
        }

        console.log('[CreateAgentWizard] Creating agent with payload:', createPayload);

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
    { id: 'phone', label: 'Phone Number', icon: Phone },
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
                  <option value="eleven_turbo_v2_5">Eleven Turbo v2.5</option>
                  <option value="eleven_turbo_v2">Eleven Turbo v2</option>
                  <option value="eleven_multilingual_v2">Eleven Multilingual v2</option>
                  <option value="eleven_flash_v2_5">Eleven Flash v2.5</option>
                  <option value="eleven_v3">Eleven V3 (Most Expressive)</option>
                  <option value="eleven_monolingual_v1">Eleven Monolingual v1</option>
                </select>
                {['eleven_v3', 'eleven_ttv_v3'].includes(formData.voiceModel) && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    ✨ V3 model selected — expressive mode enabled, voice settings (stability, speed) are auto-managed.
                  </p>
                )}
              </div>
            </div>

            {/* Hinglish Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
              <div>
                <p className="text-sm font-medium dark:text-white">Hinglish Mode</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Enable Hindi + English mixed speech. Enforces Hindi language pronunciation for the TTS model.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hinglish}
                  onChange={(e) => handleChange('hinglish', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vani-plum/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-vani-plum"></div>
              </label>
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

            {/* Voice Speed Control - Only for non-V3 models */}
            {!['eleven_v3', 'eleven_ttv_v3'].includes(formData.voiceModel) && (
              <div className="space-y-2">
                <Label>Voice Speed ({formData.voiceSpeed}x)</Label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={formData.voiceSpeed}
                  onChange={(e) => handleChange('voiceSpeed', parseFloat(e.target.value))}
                  className="w-full accent-vani-plum"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Slower (0.5x)</span>
                  <span>Normal (1.0x)</span>
                  <span>Faster (1.5x)</span>
                </div>
              </div>
            )}
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

        {/* Phone Number Tab */}
        {activeTab === 'phone' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold dark:text-white">Phone Number</h3>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select which phone number this agent will use for making calls. If not selected, the default .env credentials will be used.
            </p>

            {phoneNumbers.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Phone size={32} className="text-gray-400" />
                </div>
                <h4 className="text-base font-semibold dark:text-white mb-2">No phone numbers available</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Add a Twilio phone number first to use agent-specific credentials.
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.open('/phone-numbers', '_blank')}
                >
                  <Phone size={16} className="mr-2" />
                  Go to Phone Numbers
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Phone Number (Optional)</Label>
                  <select
                    value={formData.phoneNumberId}
                    onChange={(e) => handleChange('phoneNumberId', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-vani-plum/20 outline-none"
                  >
                    <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Use default from .env</option>
                    {phoneNumbers
                      .map(pn => (
                        <option key={pn.id} value={pn.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                          {pn.name} - {pn.number} ({pn.provider === 'sip-trunk' ? 'SIP Trunk' : 'Twilio'})
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500">
                    Select a phone number (Twilio or SIP Trunk) to use for this agent's calls.
                  </p>
                </div>

                {formData.phoneNumberId && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          Phone Number Selected
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          This agent will use the selected phone number's Twilio credentials for all outbound calls.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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

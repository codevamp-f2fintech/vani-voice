// Agent Types
export interface AgentStatistics {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    lastUsed: string | null;
}

export interface AgentMetadata {
    description: string;
    category: string;
    tags: string[];
    version: number;
    createdBy: string;
}

export interface Agent {
    _id: string;
    name: string;
    vapiAssistantId: string;
    status: 'active' | 'inactive' | 'draft';
    statistics: AgentStatistics;
    metadata: AgentMetadata;
    configuration?: any;
    createdAt: string;
    updatedAt: string;
}

export interface AgentListResponse {
    success: boolean;
    data: Agent[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface AgentResponse {
    success: boolean;
    agent: Agent;
}

export interface AgentStatsResponse {
    success: boolean;
    stats: {
        totalAgents: number;
        activeAgents: number;
        totalCalls: number;
        successfulCalls: number;
        failedCalls: number;
        mostUsed: { id: string; name: string; calls: number }[];
    };
}

// Call Types
export interface Call {
    _id: string;
    assistantId: string;
    phoneNumberId: string;
    type: string;
    startedAt: string;
    endedAt: string;
    transcript: string;
    recordingUrl: string;
    summary: string;
    createdAt: string;
    updatedAt: string;
    cost: number;
    customer: { number: string };
    status: string;
    endedReason: string;
    agentId?: string;
    agentName?: string;
}

// Voice Types
export interface Voice {
    voiceId: string;
    name: string;
    provider: string;
    previewUrl?: string;
    description?: string;
    accent?: string;
    gender?: string;
    age?: string;
    language?: string;
}

export interface VoiceListResponse {
    success: boolean;
    voices: Voice[];
    providers: string[];
}

// File Types
export interface KnowledgeFile {
    id: string;
    name: string;
    originalName: string;
    status: string;
    bytes: number;
    mimetype: string;
    createdAt: string;
}

export interface FileListResponse {
    success: boolean;
    files: KnowledgeFile[];
}

export interface FileUploadResponse {
    success: boolean;
    file: KnowledgeFile;
}

// Credential Types
export interface Credential {
    id: string;
    name: string;
    provider: string;
    createdAt: string;
}

export interface CredentialListResponse {
    success: boolean;
    credentials: Credential[];
}

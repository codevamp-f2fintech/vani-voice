import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { KnowledgeFile, FileListResponse, FileUploadResponse } from '../lib/types';

export function useFiles() {
    const [files, setFiles] = useState<KnowledgeFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFiles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.get<FileListResponse>('/vapi/files');
            if (data.success) {
                setFiles(data.files);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load files');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    return { files, loading, error, refetch: loadFiles };
}

export async function uploadFile(file: File): Promise<FileUploadResponse> {
    return api.upload<FileUploadResponse>('/vapi/files/upload', file);
}

export async function deleteFile(id: string): Promise<{ success: boolean; message: string }> {
    return api.delete(`/vapi/files/${id}`);
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileType(mimetype: string): string {
    if (mimetype.includes('pdf')) return 'PDF';
    if (mimetype.includes('text')) return 'TXT';
    if (mimetype.includes('json')) return 'JSON';
    if (mimetype.includes('csv')) return 'CSV';
    if (mimetype.includes('word') || mimetype.includes('document')) return 'DOC';
    return 'FILE';
}

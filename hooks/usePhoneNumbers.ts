import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface PhoneNumber {
    id: string;
    number: string;
    name: string;
    provider: string;
    status: string;
    assistantId: string | null;
    sipUri?: string;
    credentialId?: string;
    createdAt: string;
}

export interface SipTrunkCredential {
    id: string;
    name: string;
    provider: string;
    gateways: Array<{ ip: string; inboundEnabled: boolean }>;
}

interface PhoneNumbersResponse {
    success: boolean;
    phoneNumbers: PhoneNumber[];
    count: number;
}

interface CredentialsResponse {
    success: boolean;
    credentials: SipTrunkCredential[];
}

export function usePhoneNumbers() {
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPhoneNumbers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.get<PhoneNumbersResponse>('/vapi/phone-numbers');
            if (data.success) {
                setPhoneNumbers(data.phoneNumbers);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load phone numbers');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPhoneNumbers();
    }, [loadPhoneNumbers]);

    return { phoneNumbers, loading, error, refetch: loadPhoneNumbers };
}

export function useCredentials() {
    const [credentials, setCredentials] = useState<SipTrunkCredential[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await api.get<CredentialsResponse>('/vapi/credentials');
                if (data.success) {
                    setCredentials(data.credentials || []);
                }
            } catch (err) {
                console.error('Failed to load credentials', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return { credentials, loading };
}

// Twilio import
export async function importTwilioNumber(data: {
    number: string;
    accountSid: string;
    authToken: string;
    name?: string;
}) {
    return api.post('/vapi/phone-numbers/twilio', {
        number: data.number,
        twilioAccountSid: data.accountSid,
        twilioAuthToken: data.authToken,
        name: data.name
    });
}

// Vapi SIP creation
export async function createVapiSip(data: {
    sipIdentifier: string;
    name?: string;
    username?: string;
    password?: string;
}) {
    return api.post('/vapi/phone-numbers/vapi-sip', data);
}

// SIP Trunk creation
export async function createSipTrunk(data: {
    number: string;
    credentialId: string;
    name?: string;
    numberE164CheckEnabled?: boolean;
}) {
    return api.post('/vapi/phone-numbers/sip-trunk', data);
}

// Assign agent to phone number
export async function assignAgentToPhoneNumber(phoneNumberId: string, assistantId: string | null) {
    return api.patch(`/vapi/phone-numbers/${phoneNumberId}/assign`, { assistantId });
}

// Delete phone number
export async function deletePhoneNumber(id: string) {
    return api.delete(`/vapi/phone-numbers/${id}`);
}

// Create SIP Trunk credential
export async function createSipTrunkCredential(data: {
    name: string;
    gatewayIp: string;
    authUsername?: string;
    authPassword?: string;
}) {
    return api.post('/vapi/credentials/sip-trunk', data);
}

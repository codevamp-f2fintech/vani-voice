
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Label, Badge } from '../components/UI';
import {
    Phone,
    Plus,
    Trash2,
    Loader2,
    User,
    Link2,
    X,
    Check
} from 'lucide-react';
import {
    usePhoneNumbers,
    useCredentials,
    importTwilioNumber,
    createVapiSip,
    createSipTrunk,
    createSipTrunkCredential,
    assignAgentToPhoneNumber,
    deletePhoneNumber,
    PhoneNumber
} from '../hooks/usePhoneNumbers';
import { useAgents } from '../hooks/useAgents';

type TabType = 'twilio' | 'vapi-sip' | 'sip-trunk';

const PhoneNumbers: React.FC = () => {
    const { phoneNumbers, loading, refetch } = usePhoneNumbers();
    const { credentials, loading: credLoading } = useCredentials();
    const { agents } = useAgents();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('twilio');
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [twilioForm, setTwilioForm] = useState({
        number: '', accountSid: '', authToken: '', name: ''
    });
    const [vapiSipForm, setVapiSipForm] = useState({
        sipIdentifier: '', name: '', username: '', password: ''
    });
    const [sipTrunkForm, setSipTrunkForm] = useState({
        number: '', credentialId: '', name: '', allowNonE164: false
    });
    const [credentialForm, setCredentialForm] = useState({
        name: '', gatewayIp: '', authUsername: '', authPassword: ''
    });

    const handleImportTwilio = async () => {
        if (!twilioForm.number || !twilioForm.accountSid || !twilioForm.authToken) {
            alert('Please fill all required fields');
            return;
        }
        setSubmitting(true);
        try {
            await importTwilioNumber(twilioForm);
            setTwilioForm({ number: '', accountSid: '', authToken: '', name: '' });
            setDialogOpen(false);
            refetch();
        } catch (err: any) {
            alert(err.message || 'Failed to import Twilio number');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateVapiSip = async () => {
        if (!vapiSipForm.sipIdentifier) {
            alert('SIP Identifier is required');
            return;
        }
        setSubmitting(true);
        try {
            await createVapiSip(vapiSipForm);
            setVapiSipForm({ sipIdentifier: '', name: '', username: '', password: '' });
            setDialogOpen(false);
            refetch();
        } catch (err: any) {
            alert(err.message || 'Failed to create Vapi SIP');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateSipTrunk = async () => {
        if (!sipTrunkForm.number || !sipTrunkForm.credentialId) {
            alert('Number and Credential are required');
            return;
        }
        setSubmitting(true);
        try {
            await createSipTrunk({
                ...sipTrunkForm,
                numberE164CheckEnabled: !sipTrunkForm.allowNonE164
            });
            setSipTrunkForm({ number: '', credentialId: '', name: '', allowNonE164: false });
            setDialogOpen(false);
            refetch();
        } catch (err: any) {
            alert(err.message || 'Failed to create SIP Trunk number');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateCredential = async () => {
        if (!credentialForm.name || !credentialForm.gatewayIp) {
            alert('Name and Gateway IP are required');
            return;
        }
        setSubmitting(true);
        try {
            await createSipTrunkCredential(credentialForm);
            setCredentialForm({ name: '', gatewayIp: '', authUsername: '', authPassword: '' });
            // Refresh credentials by reloading whole page data
            window.location.reload();
        } catch (err: any) {
            alert(err.message || 'Failed to create credential');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignAgent = async (phoneNumberId: string, assistantId: string) => {
        try {
            await assignAgentToPhoneNumber(phoneNumberId, assistantId === 'unassigned' ? null : assistantId);
            refetch();
        } catch (err: any) {
            alert(err.message || 'Failed to assign agent');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this phone number?')) return;
        try {
            await deletePhoneNumber(id);
            refetch();
        } catch (err: any) {
            alert(err.message || 'Failed to delete phone number');
        }
    };

    const getAgentName = (assistantId: string | null): string => {
        if (!assistantId) return 'Not assigned';
        const agent = agents.find(a => a.vapiAssistantId === assistantId);
        return agent?.name || 'Unknown Agent';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-vani-plum" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black dark:text-white tracking-tight">Phone Numbers</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Manage your phone numbers and assign them to agents.
                    </p>
                </div>
                <Button className="h-14 px-8 shadow-xl" onClick={() => setDialogOpen(true)}>
                    <Plus size={20} className="mr-2" /> Add Phone Number
                </Button>
            </div>

            {/* Phone Numbers List */}
            {phoneNumbers.length === 0 ? (
                <Card className="p-12 text-center border-2">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Phone size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold dark:text-white mb-2">No phone numbers yet</h3>
                    <p className="text-gray-500 mb-6">Add your first phone number to start receiving calls.</p>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus size={18} className="mr-2" /> Add Your First Phone Number
                    </Button>
                </Card>
            ) : (
                <div className="space-y-4">
                    {phoneNumbers.map(pn => (
                        <Card key={pn.id} className="p-6 border-2 hover:border-vani-plum/30 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-vani-plum/10 flex items-center justify-center text-vani-plum">
                                        <Phone size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold dark:text-white">{pn.name || pn.number}</h3>
                                        <p className="text-sm text-gray-500">
                                            {pn.sipUri || pn.number} • <Badge variant="default">{pn.provider}</Badge>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Agent Assignment */}
                                    <div className="flex items-center gap-2">
                                        <User size={16} className="text-gray-400" />
                                        <select
                                            value={pn.assistantId || 'unassigned'}
                                            onChange={(e) => handleAssignAgent(pn.id, e.target.value)}
                                            className="px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white outline-none"
                                        >
                                            <option value="unassigned">Not assigned</option>
                                            {agents.map(a => (
                                                <option key={a._id} value={a.vapiAssistantId}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(pn.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Phone Number Dialog */}
            {dialogOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black dark:text-white">Add Phone Number</h2>
                                <p className="text-sm text-gray-500">Choose an option to add a phone number</p>
                            </div>
                            <button onClick={() => setDialogOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 p-4 border-b border-gray-100 dark:border-white/10">
                            <Button
                                variant={activeTab === 'twilio' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveTab('twilio')}
                            >
                                Import Twilio
                            </Button>
                            <Button
                                variant={activeTab === 'vapi-sip' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveTab('vapi-sip')}
                            >
                                Free Vapi SIP
                            </Button>
                            <Button
                                variant={activeTab === 'sip-trunk' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveTab('sip-trunk')}
                            >
                                BYO SIP Trunk
                            </Button>
                        </div>

                        <div className="p-6">
                            {/* Twilio Form */}
                            {activeTab === 'twilio' && (
                                <div className="space-y-4">
                                    <div>
                                        <Label>Twilio Phone Number *</Label>
                                        <Input
                                            value={twilioForm.number}
                                            onChange={(e) => setTwilioForm(f => ({ ...f, number: e.target.value }))}
                                            placeholder="+14156021922"
                                        />
                                    </div>
                                    <div>
                                        <Label>Twilio Account SID *</Label>
                                        <Input
                                            value={twilioForm.accountSid}
                                            onChange={(e) => setTwilioForm(f => ({ ...f, accountSid: e.target.value }))}
                                            placeholder="AC..."
                                        />
                                    </div>
                                    <div>
                                        <Label>Twilio Auth Token *</Label>
                                        <Input
                                            type="password"
                                            value={twilioForm.authToken}
                                            onChange={(e) => setTwilioForm(f => ({ ...f, authToken: e.target.value }))}
                                            placeholder="Twilio Auth Token"
                                        />
                                    </div>
                                    <div>
                                        <Label>Label (Optional)</Label>
                                        <Input
                                            value={twilioForm.name}
                                            onChange={(e) => setTwilioForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder="My Support Number"
                                        />
                                    </div>
                                    <Button onClick={handleImportTwilio} disabled={submitting} className="w-full h-12">
                                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</> : 'Import from Twilio'}
                                    </Button>
                                </div>
                            )}

                            {/* Vapi SIP Form */}
                            {activeTab === 'vapi-sip' && (
                                <div className="space-y-4">
                                    <div>
                                        <Label>SIP Identifier *</Label>
                                        <Input
                                            value={vapiSipForm.sipIdentifier}
                                            onChange={(e) => setVapiSipForm(f => ({ ...f, sipIdentifier: e.target.value }))}
                                            placeholder="my-example-identifier"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Will be used as: sip:{vapiSipForm.sipIdentifier || 'identifier'}@sip.vapi.ai
                                        </p>
                                    </div>
                                    <div>
                                        <Label>Label (Optional)</Label>
                                        <Input
                                            value={vapiSipForm.name}
                                            onChange={(e) => setVapiSipForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder="Label for SIP URI"
                                        />
                                    </div>
                                    <div className="border-t pt-4 dark:border-white/10">
                                        <p className="text-sm font-medium mb-3 dark:text-white">SIP Authentication (Optional)</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Username</Label>
                                                <Input
                                                    value={vapiSipForm.username}
                                                    onChange={(e) => setVapiSipForm(f => ({ ...f, username: e.target.value }))}
                                                    placeholder="SIP Username"
                                                />
                                            </div>
                                            <div>
                                                <Label>Password</Label>
                                                <Input
                                                    type="password"
                                                    value={vapiSipForm.password}
                                                    onChange={(e) => setVapiSipForm(f => ({ ...f, password: e.target.value }))}
                                                    placeholder="SIP Password"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button onClick={handleCreateVapiSip} disabled={submitting} className="w-full h-12">
                                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Vapi SIP'}
                                    </Button>
                                </div>
                            )}

                            {/* SIP Trunk Form */}
                            {activeTab === 'sip-trunk' && (
                                <div className="space-y-4">
                                    <div>
                                        <Label>Phone Number *</Label>
                                        <Input
                                            value={sipTrunkForm.number}
                                            onChange={(e) => setSipTrunkForm(f => ({ ...f, number: e.target.value }))}
                                            placeholder="+14155551234"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="allowNonE164"
                                            checked={sipTrunkForm.allowNonE164}
                                            onChange={(e) => setSipTrunkForm(f => ({ ...f, allowNonE164: e.target.checked }))}
                                            className="accent-vani-plum"
                                        />
                                        <label htmlFor="allowNonE164" className="text-sm dark:text-gray-300">
                                            Allow non-E164 phone numbers
                                        </label>
                                    </div>
                                    <div>
                                        <Label>SIP Trunk Credential *</Label>
                                        <select
                                            value={sipTrunkForm.credentialId}
                                            onChange={(e) => setSipTrunkForm(f => ({ ...f, credentialId: e.target.value }))}
                                            className="w-full h-12 px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white outline-none"
                                        >
                                            <option value="">Select a SIP trunk credential</option>
                                            {credentials.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Label (Optional)</Label>
                                        <Input
                                            value={sipTrunkForm.name}
                                            onChange={(e) => setSipTrunkForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder="Label for Phone Number"
                                        />
                                    </div>

                                    {/* Create Credential Section */}
                                    <div className="border-t pt-4 dark:border-white/10">
                                        <p className="text-sm font-medium mb-3 dark:text-white">Need a SIP Trunk Credential?</p>
                                        <div className="space-y-3 bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    placeholder="Credential Name"
                                                    value={credentialForm.name}
                                                    onChange={(e) => setCredentialForm(f => ({ ...f, name: e.target.value }))}
                                                />
                                                <Input
                                                    placeholder="Gateway IP (sip.provider.com)"
                                                    value={credentialForm.gatewayIp}
                                                    onChange={(e) => setCredentialForm(f => ({ ...f, gatewayIp: e.target.value }))}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    placeholder="Auth Username (optional)"
                                                    value={credentialForm.authUsername}
                                                    onChange={(e) => setCredentialForm(f => ({ ...f, authUsername: e.target.value }))}
                                                />
                                                <Input
                                                    type="password"
                                                    placeholder="Auth Password (optional)"
                                                    value={credentialForm.authPassword}
                                                    onChange={(e) => setCredentialForm(f => ({ ...f, authPassword: e.target.value }))}
                                                />
                                            </div>
                                            <Button onClick={handleCreateCredential} disabled={submitting} variant="outline" size="sm">
                                                Create Credential
                                            </Button>
                                        </div>
                                    </div>

                                    <Button onClick={handleCreateSipTrunk} disabled={submitting} className="w-full h-12">
                                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create SIP Trunk Number'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default PhoneNumbers;

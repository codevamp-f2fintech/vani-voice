
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Label, Badge } from '../components/UI';
import {
  User,
  Key,
  CreditCard,
  Bell,
  Shield,
  Globe,
  Copy,
  ExternalLink,
  Trash2,
  Loader2,
  Check
} from 'lucide-react';
import { api } from '../lib/api';
import type { CredentialListResponse } from '../lib/types';

const Settings: React.FC = () => {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const data = await api.get<CredentialListResponse>('/vapi/credentials');
      if (data.success) {
        setCredentials(data.credentials || []);
      }
    } catch (err) {
      console.error('Failed to load credentials', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your profile, API keys, and preferences.</p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-vani-plum">
            <User size={20} />
            <h2 className="text-lg font-bold dark:text-white">Personal Profile</h2>
          </div>
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full vani-gradient p-1">
                  <div className="w-full h-full rounded-full bg-white dark:bg-vani-dark flex items-center justify-center text-4xl font-bold text-vani-plum">U</div>
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-full shadow-lg text-vani-plum hover:scale-110 transition-transform">
                  <Globe size={14} />
                </button>
              </div>
              <div className="flex-1 grid md:grid-cols-2 gap-4 w-full">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input defaultValue="User" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue="user@example.com" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input defaultValue="+91 00000 00000" />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Language</Label>
                  <select className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white outline-none">
                    <option>Hindi</option>
                    <option>English</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button size="sm">Save Changes</Button>
            </div>
          </Card>
        </div>

        {/* API Keys Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-vani-plum">
            <Key size={20} />
            <h2 className="text-lg font-bold dark:text-white">API Credentials</h2>
          </div>
          <Card className="p-6 space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Connected service credentials for your Vani agents.</p>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-vani-plum" />
              </div>
            ) : credentials.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No credentials configured yet</p>
                <Button variant="outline" size="sm">Add Credential</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {credentials.map((cred: any) => (
                  <div key={cred.id} className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{cred.provider}</p>
                      <p className="text-sm font-mono dark:text-white">{cred.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopy(cred.id, cred.id)}
                      >
                        {copied === cred.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Preferences Section */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-vani-plum">
              <Bell size={20} />
              <h2 className="text-lg font-bold dark:text-white">Notifications</h2>
            </div>
            <Card className="p-6 space-y-4">
              {[
                { l: 'Low Credit Alert', d: 'Notify when balance is below ₹500' },
                { l: 'Call Failures', d: 'Daily summary of failed call attempts' },
                { l: 'New Templates', d: 'Weekly updates on new agent templates' }
              ].map(n => (
                <div key={n.l} className="flex items-center justify-between py-2 border-b last:border-0 dark:border-white/5">
                  <div>
                    <p className="text-sm font-bold dark:text-gray-200">{n.l}</p>
                    <p className="text-[10px] text-gray-500">{n.d}</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded-md accent-vani-plum cursor-pointer" />
                </div>
              ))}
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-vani-plum">
              <Shield size={20} />
              <h2 className="text-lg font-bold dark:text-white">Security</h2>
            </div>
            <Card className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-bold dark:text-gray-200">Two-Factor Authentication</p>
                <p className="text-xs text-gray-500 mb-4">Add an extra layer of security to your account.</p>
                <Button variant="outline" size="sm" className="w-full">Enable 2FA</Button>
              </div>
              <div className="space-y-2 pt-4 border-t dark:border-white/5">
                <p className="text-sm font-bold text-red-500">Delete Project</p>
                <p className="text-xs text-gray-500 mb-4">This action is permanent and cannot be undone.</p>
                <Button variant="danger" size="sm" className="w-full">Delete Everything</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;


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
  Check,
  Save,
  Lock
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { CredentialListResponse } from '../lib/types';

const Settings: React.FC = () => {
  const { user, updateProfile, refreshUser } = useAuth();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    preferredLanguage: 'hi'
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Notification settings
  const [notifications, setNotifications] = useState({
    lowCreditAlert: true,
    callFailures: true,
    newTemplates: false
  });

  // Load user data into form
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        preferredLanguage: user.preferredLanguage || 'hi'
      });
      setNotifications({
        lowCreditAlert: user.settings?.notifications?.lowCreditAlert ?? true,
        callFailures: user.settings?.notifications?.callFailures ?? true,
        newTemplates: user.settings?.notifications?.newTemplates ?? false
      });
    }
  }, [user]);

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

  const handleProfileSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);

      const success = await updateProfile({
        name: profileData.name,
        phone: profileData.phone,
        preferredLanguage: profileData.preferredLanguage,
        settings: {
          notifications,
          twoFactorEnabled: user?.settings?.twoFactorEnabled || false
        }
      });

      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save profile', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      setChangingPassword(true);

      await api.patch('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordSuccess(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Get user initials
  const getInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
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
                  <div className="w-full h-full rounded-full bg-white dark:bg-vani-dark flex items-center justify-center text-4xl font-bold text-vani-plum">
                    {getInitials()}
                  </div>
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-full shadow-lg text-vani-plum hover:scale-110 transition-transform">
                  <Globe size={14} />
                </button>
              </div>
              <div className="flex-1 grid md:grid-cols-2 gap-4 w-full">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 00000 00000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Language</Label>
                  <select
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white outline-none"
                    value={profileData.preferredLanguage}
                    onChange={(e) => setProfileData(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                  >
                    <option value="hi">Hindi</option>
                    <option value="en">English</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                    <option value="mr">Marathi</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end items-center gap-3">
              {saveSuccess && (
                <span className="text-sm text-green-500 flex items-center gap-1">
                  <Check size={16} /> Saved successfully
                </span>
              )}
              <Button size="sm" onClick={handleProfileSave} disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                Save Changes
              </Button>
            </div>
          </Card>
        </div>

        {/* Password Change Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-vani-plum">
            <Lock size={20} />
            <h2 className="text-lg font-bold dark:text-white">Change Password</h2>
          </div>
          <Card className="p-6 space-y-4">
            {passwordError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400">
                Password changed successfully!
              </div>
            )}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={handlePasswordChange}
              disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword}
            >
              {changingPassword ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Change Password
            </Button>
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
                { key: 'lowCreditAlert', l: 'Low Credit Alert', d: 'Notify when balance is below ₹500' },
                { key: 'callFailures', l: 'Call Failures', d: 'Daily summary of failed call attempts' },
                { key: 'newTemplates', l: 'New Templates', d: 'Weekly updates on new agent templates' }
              ].map(n => (
                <div key={n.key} className="flex items-center justify-between py-2 border-b last:border-0 dark:border-white/5">
                  <div>
                    <p className="text-sm font-bold dark:text-gray-200">{n.l}</p>
                    <p className="text-[10px] text-gray-500">{n.d}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications[n.key as keyof typeof notifications]}
                    onChange={(e) => setNotifications(prev => ({ ...prev, [n.key]: e.target.checked }))}
                    className="w-5 h-5 rounded-md accent-vani-plum cursor-pointer"
                  />
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
                <p className="text-sm font-bold text-red-500">Delete Account</p>
                <p className="text-xs text-gray-500 mb-4">This action is permanent and cannot be undone.</p>
                <Button variant="danger" size="sm" className="w-full">Delete Everything</Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-vani-plum">
            <CreditCard size={20} />
            <h2 className="text-lg font-bold dark:text-white">Subscription</h2>
          </div>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold dark:text-white capitalize">{user?.subscription?.tier || 'Free'} Plan</p>
                <p className="text-sm text-gray-500">
                  Wallet Balance: <span className="font-bold text-vani-plum">₹{user?.wallet?.balance?.toFixed(2) || '0.00'}</span>
                </p>
              </div>
              <Button onClick={() => window.location.hash = '#/pricing'}>Upgrade Plan</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;

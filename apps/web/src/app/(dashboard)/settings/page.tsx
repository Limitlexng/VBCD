'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Moon, Sun, Globe, Shield, Smartphone, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useMutation } from '@tanstack/react-query';
import { api, formatApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!enabled)}
      className={cn('relative w-11 h-6 rounded-full transition-colors', enabled ? 'bg-primary' : 'bg-muted-foreground/30')}>
      <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all', enabled ? 'right-1' : 'left-1')} />
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const changePwdMutation = useMutation({
    mutationFn: async () => {
      if (newPwd !== confirmPwd) throw new Error('Passwords do not match');
      const { data } = await api.post('/auth/change-password', { oldPassword: oldPwd, newPassword: newPwd });
      return data;
    },
    onSuccess: () => { toast.success('Password changed!'); setShowChangePwd(false); setOldPwd(''); setNewPwd(''); setConfirmPwd(''); },
    onError: (e) => toast.error(formatApiError(e)),
  });

  return (
    <div className="px-4 py-4">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold mb-5">Settings</motion.h1>

      <div className="space-y-5">
        {/* Notifications */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Notifications</p>
          <div className="berry-card p-0 divide-y divide-border overflow-hidden">
            {[
              { label: 'Push Notifications', desc: 'Alerts on your device', value: pushEnabled, onChange: setPushEnabled },
              { label: 'Email Notifications', desc: 'Transaction receipts', value: emailEnabled, onChange: setEmailEnabled },
              { label: 'SMS Alerts', desc: 'Text message alerts', value: smsEnabled, onChange: setSmsEnabled },
            ].map(({ label, desc, value, onChange }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Toggle enabled={value} onChange={onChange} />
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Security</p>
          <div className="berry-card p-0 divide-y divide-border overflow-hidden">
            <button onClick={() => setShowChangePwd((v) => !v)} className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-muted/50 transition-colors">
              <Shield size={16} className="text-muted-foreground" />
              <span className="flex-1 text-sm font-medium text-left">Change Password</span>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
            <button className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-muted/50 transition-colors">
              <Smartphone size={16} className="text-muted-foreground" />
              <span className="flex-1 text-sm font-medium text-left">Transaction PIN</span>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {showChangePwd && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="berry-card space-y-3">
            <h3 className="font-semibold text-sm">Change Password</h3>
            <input type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} placeholder="Current password" className="berry-input" />
            <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="New password" className="berry-input" />
            <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Confirm new password" className="berry-input" />
            <button onClick={() => changePwdMutation.mutate()} disabled={!oldPwd || !newPwd || !confirmPwd || changePwdMutation.isPending} className="berry-btn-primary w-full">
              {changePwdMutation.isPending ? 'Saving...' : 'Update Password'}
            </button>
          </motion.div>
        )}

        {/* Account */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Account</p>
          <div className="berry-card space-y-2">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Email</span><span className="text-sm font-medium">{user?.email}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Phone</span><span className="text-sm font-medium">{user?.phone}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Account Tier</span><span className="text-sm font-medium">Tier {user?.tier || 0}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">2FA</span>
              <span className={cn('text-sm font-medium', user?.isTwoFactorEnabled ? 'text-green-600' : 'text-muted-foreground')}>
                {user?.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

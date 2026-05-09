'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { api, formatApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { OtpType } from '@berry-x/types';

export default function VerifyPage() {
  const router = useRouter();
  const params = useSearchParams();
  const identifier = params.get('identifier') || '';
  const type = params.get('type') as OtpType || OtpType.EMAIL_VERIFICATION;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const { setTokens } = useAuthStore();

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
      setOtp(newOtp);
      inputs.current[Math.min(index + digits.length, 5)]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { identifier, otp: code, type });
      const result = data.data || data;
      if (result.tokens) {
        setTokens(result.tokens.accessToken, result.tokens.refreshToken);
        router.push('/home');
      } else {
        router.push(type === OtpType.EMAIL_VERIFICATION ? '/home' : '/login');
      }
    } catch (err) {
      setError(formatApiError(err));
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', { identifier, type });
      setResendTimer(60);
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const code = otp.join('');
  if (code.length === 6 && !isLoading) handleVerify();

  const titles: Partial<Record<OtpType, { title: string; desc: string }>> = {
    [OtpType.EMAIL_VERIFICATION]: { title: 'Verify your email', desc: `Enter the 6-digit code sent to ${identifier}` },
    [OtpType.TWO_FACTOR]: { title: 'Two-factor auth', desc: 'Enter your 2FA code' },
    [OtpType.PASSWORD_RESET]: { title: 'Reset code', desc: `Enter the code sent to ${identifier}` },
    [OtpType.LOGIN]: { title: 'Login verification', desc: `Enter the code sent to ${identifier}` },
  };
  const { title, desc } = titles[type] || { title: 'Verification', desc: 'Enter your code' };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6">
      <div className="pt-16 pb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-2xl">✉️</span>
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-2">{desc}</p>
        </motion.div>
      </div>

      <motion.div className="flex-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex gap-3 justify-center mb-8">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              maxLength={1}
              className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background transition-colors focus:outline-none ${
                digit ? 'border-primary bg-primary/5' : 'border-input focus:border-primary'
              }`}
              inputMode="numeric"
            />
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center mb-6">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm mb-4 text-center">
            {error}
          </motion.div>
        )}

        <button
          onClick={handleVerify}
          disabled={code.length !== 6 || isLoading}
          className="berry-btn-primary"
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Didn&apos;t receive the code?{' '}
          {resendTimer > 0 ? (
            <span>Resend in {resendTimer}s</span>
          ) : (
            <button onClick={handleResend} className="text-primary font-semibold">Resend</button>
          )}
        </p>
      </motion.div>
    </div>
  );
}

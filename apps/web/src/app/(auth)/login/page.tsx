'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import { formatApiError } from '@/lib/api';
import { generateDeviceId } from '@/lib/utils';

const schema = z.object({
  identifier: z.string().min(1, 'Email or phone required'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const result = await login(data.identifier, data.password, generateDeviceId());
      if (result.requiresTwoFactor) {
        router.push(`/verify?type=two_factor&identifier=${encodeURIComponent(data.identifier)}`);
      } else {
        router.push('/home');
      }
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground mt-1">Sign in to your Berry X account</p>
        </motion.div>
      </div>

      {/* Form */}
      <motion.div
        className="flex-1 px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email or Phone</label>
            <input
              {...register('identifier')}
              className="berry-input"
              placeholder="Enter email or phone number"
              autoComplete="username"
            />
            {errors.identifier && <p className="text-destructive text-xs mt-1">{errors.identifier.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className="berry-input pr-10"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          </div>

          <Link href="/reset-password" className="block text-right text-sm text-primary font-medium">
            Forgot password?
          </Link>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm"
            >
              {error}
            </motion.div>
          )}

          <button type="submit" disabled={isLoading} className="berry-btn-primary flex items-center justify-center gap-2">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary font-semibold">
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import { formatApiError } from '@/lib/api';

const schema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and number'),
  referralCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const { register, handleSubmit, formState: { errors }, trigger, getValues } = useForm<FormData>({ resolver: zodResolver(schema) });

  const nextStep = async () => {
    const valid = await trigger(['firstName', 'lastName', 'phone']);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await registerUser(data);
      router.push(`/verify?type=email_verification&identifier=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-6 pt-12 pb-6">
        {step > 1 && (
          <button onClick={() => setStep(1)} className="mb-4 flex items-center gap-1 text-muted-foreground text-sm">
            <ArrowLeft size={16} /> Back
          </button>
        )}
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-muted-foreground mt-1">Step {step} of 2 — {step === 1 ? 'Personal info' : 'Security'}</p>

          {/* Progress bar */}
          <div className="flex gap-1.5 mt-4">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div className="flex-1 px-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">First name</label>
                  <input {...register('firstName')} className="berry-input" placeholder="John" />
                  {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Last name</label>
                  <input {...register('lastName')} className="berry-input" placeholder="Doe" />
                  {errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Phone number</label>
                <input {...register('phone')} className="berry-input" placeholder="+2348012345678" type="tel" />
                {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Referral code (optional)</label>
                <input {...register('referralCode')} className="berry-input" placeholder="Enter referral code" />
              </div>

              <button type="button" onClick={nextStep} className="berry-btn-primary">Continue</button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email address</label>
                <input {...register('email')} className="berry-input" placeholder="john@example.com" type="email" autoComplete="email" />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Password</label>
                <div className="relative">
                  <input {...register('password')} type={showPassword ? 'text' : 'password'} className="berry-input pr-10" placeholder="Create a strong password" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm">{error}</div>
              )}

              <p className="text-xs text-muted-foreground">
                By creating an account you agree to our{' '}
                <span className="text-primary">Terms of Service</span> and{' '}
                <span className="text-primary">Privacy Policy</span>.
              </p>

              <button type="submit" disabled={isLoading} className="berry-btn-primary flex items-center justify-center gap-2">
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </>
          )}
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PiArrowRightBold, PiWarningCircleBold } from 'react-icons/pi';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginErrors = {
  email?: string;
  password?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [shakeField, setShakeField] = useState<keyof LoginErrors | null>(null);

  const triggerShake = (field: keyof LoginErrors) => {
    setShakeField(null);
    setTimeout(() => setShakeField(field), 10);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name as keyof LoginErrors]) {
      setErrors(prev => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: LoginErrors = {};
      let firstErrorField: keyof LoginErrors | null = null;
      
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof LoginErrors;
        fieldErrors[field] = issue.message;
        if (!firstErrorField) firstErrorField = field;
      });
      
      setErrors(fieldErrors);
      if (firstErrorField) triggerShake(firstErrorField);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-brand-canvas-soft flex items-center justify-center p-6 relative">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-full bg-brand-ink flex items-center justify-center group-hover:bg-brand-primary transition-colors">
          <span className="text-brand-canvas font-black text-sm group-hover:text-brand-ink transition-colors">G</span>
        </div>
        <span className="font-display font-bold text-xl text-brand-ink">GroundedAI</span>
      </Link>

      <div className="bg-brand-canvas rounded-[2rem] p-10 sm:p-12 shadow-sm border border-brand-canvas-soft max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="text-center mb-8">
          <h1 className="font-display font-black text-3xl text-brand-ink mb-2">Welcome back</h1>
          <p className="text-brand-body font-medium">Log in to manage your agents.</p>
        </div>

        <button 
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full bg-brand-canvas-soft/50 hover:bg-brand-canvas-soft border border-brand-canvas-soft text-brand-ink font-bold text-base px-6 py-4 rounded-xl flex items-center justify-center gap-3 transition-colors mb-6 disabled:opacity-50"
        >
          <FcGoogle className="w-5 h-5" />
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-grow h-px bg-brand-canvas-soft"></div>
          <span className="text-brand-mute text-xs font-semibold uppercase tracking-wider">Or</span>
          <div className="flex-grow h-px bg-brand-canvas-soft"></div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className={shakeField === 'email' ? 'animate-shake' : ''}>
            <label className="block text-sm font-semibold text-brand-ink mb-2">Email address</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              className={`w-full bg-brand-canvas-soft/50 border-2 outline-none px-4 py-3.5 rounded-xl text-brand-ink font-medium transition-colors ${
                errors.email ? 'border-brand-negative focus:border-brand-negative' : 'border-transparent focus:border-brand-primary'
              }`}
            />
            {errors.email && (
              <div className="flex items-center gap-1.5 mt-2 text-brand-negative text-sm font-semibold">
                <PiWarningCircleBold className="w-4 h-4" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>
          <div className={shakeField === 'password' ? 'animate-shake' : ''}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-brand-ink">Password</label>
              <Link href="#" className="text-brand-primary hover:text-brand-primary-active text-sm font-semibold transition-colors">Forgot?</Link>
            </div>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full bg-brand-canvas-soft/50 border-2 outline-none px-4 py-3.5 rounded-xl text-brand-ink font-medium transition-colors ${
                errors.password ? 'border-brand-negative focus:border-brand-negative' : 'border-transparent focus:border-brand-primary'
              }`}
            />
            {errors.password && (
              <div className="flex items-center gap-1.5 mt-2 text-brand-negative text-sm font-semibold">
                <PiWarningCircleBold className="w-4 h-4" />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-primary text-brand-on-primary hover:bg-brand-primary-active disabled:opacity-50 font-bold text-lg px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
            {!isLoading && <PiArrowRightBold className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-8 text-center text-brand-body font-medium">
          Don't have an account?{' '}
          <Link href="/signup" className="text-brand-ink hover:text-brand-primary font-bold underline decoration-2 underline-offset-4 transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

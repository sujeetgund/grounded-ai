'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PiArrowRightBold, PiWarningCircleBold } from 'react-icons/pi';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
});

type SignupErrors = {
  fullName?: string;
  email?: string;
  password?: string;
};

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState<SignupErrors>({});
  const [shakeField, setShakeField] = useState<keyof SignupErrors | null>(null);

  const triggerShake = (field: keyof SignupErrors) => {
    setShakeField(null);
    setTimeout(() => setShakeField(field), 10);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name as keyof SignupErrors]) {
      setErrors(prev => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: SignupErrors = {};
      let firstErrorField: keyof SignupErrors | null = null;
      
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof SignupErrors;
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
    <div className="min-h-screen bg-brand-canvas-soft flex items-center justify-center p-6 py-12 relative">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-full bg-brand-ink flex items-center justify-center group-hover:bg-brand-primary transition-colors">
          <span className="text-brand-canvas font-black text-sm group-hover:text-brand-ink transition-colors">G</span>
        </div>
        <span className="font-display font-bold text-xl text-brand-ink">GroundedAI</span>
      </Link>

      <div className="bg-brand-canvas rounded-[2rem] p-10 sm:p-12 shadow-sm border border-brand-canvas-soft max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="text-center mb-8">
          <h1 className="font-display font-black text-3xl text-brand-ink mb-2">Create an account</h1>
          <p className="text-brand-body font-medium">Start building grounded AI agents today.</p>
        </div>

        <button 
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full bg-brand-canvas-soft/50 hover:bg-brand-canvas-soft border border-brand-canvas-soft text-brand-ink font-bold text-base px-6 py-4 rounded-xl flex items-center justify-center gap-3 transition-colors mb-6 disabled:opacity-50"
        >
          <FcGoogle className="w-5 h-5" />
          Sign up with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-grow h-px bg-brand-canvas-soft"></div>
          <span className="text-brand-mute text-xs font-semibold uppercase tracking-wider">Or</span>
          <div className="flex-grow h-px bg-brand-canvas-soft"></div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className={shakeField === 'fullName' ? 'animate-shake' : ''}>
            <label className="block text-sm font-semibold text-brand-ink mb-2">Full Name</label>
            <input 
              type="text" 
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Jane Doe"
              className={`w-full bg-brand-canvas-soft/50 border-2 outline-none px-4 py-3.5 rounded-xl text-brand-ink font-medium transition-colors ${
                errors.fullName ? 'border-brand-negative focus:border-brand-negative' : 'border-transparent focus:border-brand-primary'
              }`}
            />
            {errors.fullName && (
              <div className="flex items-center gap-1.5 mt-2 text-brand-negative text-sm font-semibold">
                <PiWarningCircleBold className="w-4 h-4" />
                <span>{errors.fullName}</span>
              </div>
            )}
          </div>
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
            <label className="block text-sm font-semibold text-brand-ink mb-2">Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
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
            {isLoading ? 'Creating account...' : 'Create account'}
            {!isLoading && <PiArrowRightBold className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-8 text-center text-brand-body font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-ink hover:text-brand-primary font-bold underline decoration-2 underline-offset-4 transition-colors">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

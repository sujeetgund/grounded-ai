'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  PiCaretLeftBold, 
  PiUserDuotone,
  PiLockKeyDuotone,
  PiCheckCircleFill
} from 'react-icons/pi';

export default function ProfilePage() {
  const [isSaved, setIsSaved] = useState(false);
  const [name, setName] = useState('Sujeet');
  const [email, setEmail] = useState('sujeet@example.com');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-brand-canvas-soft font-sans flex flex-col">
      
      {/* Header NavBar */}
      <header className="bg-brand-canvas px-8 py-4 flex items-center border-b border-brand-canvas-soft">
        <Link href="/dashboard" className="w-10 h-10 rounded-full bg-brand-canvas-soft flex items-center justify-center hover:bg-brand-primary-pale transition-colors mr-4">
          <PiCaretLeftBold className="w-5 h-5 text-brand-ink" />
        </Link>
        <h1 className="font-display font-black text-2xl text-brand-ink">Profile</h1>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl w-full mx-auto p-8 flex flex-col gap-10">
        
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-brand-ink text-brand-canvas flex items-center justify-center font-display font-black text-4xl shadow-lg relative group cursor-pointer">
            S
            <div className="absolute inset-0 bg-brand-ink/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-xs font-bold uppercase tracking-wider text-brand-canvas">Edit</span>
            </div>
          </div>
          <div>
            <h2 className="font-display font-black text-3xl text-brand-ink">{name}</h2>
            <p className="text-brand-body text-lg font-medium">{email}</p>
          </div>
        </div>

        <div className="bg-brand-canvas rounded-3xl p-8 shadow-sm border border-brand-canvas-soft flex flex-col gap-8">
          
          <div className="flex items-center gap-3 border-b border-brand-canvas-soft pb-4">
            <PiUserDuotone className="w-6 h-6 text-brand-primary" />
            <h3 className="font-display font-bold text-xl text-brand-ink">Personal Information</h3>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-brand-ink mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-brand-canvas-soft/50 border-2 border-transparent focus:border-brand-primary outline-none px-4 py-3.5 rounded-xl text-brand-ink font-medium transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-ink mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-canvas-soft/50 border-2 border-transparent focus:border-brand-primary outline-none px-4 py-3.5 rounded-xl text-brand-ink font-medium transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                {isSaved && (
                  <div className="flex items-center gap-2 text-brand-positive font-semibold animate-in fade-in zoom-in duration-300">
                    <PiCheckCircleFill className="w-5 h-5" />
                    Profile updated safely.
                  </div>
                )}
              </div>
              <button 
                type="submit"
                className="bg-brand-primary text-brand-on-primary hover:bg-brand-primary-active font-bold px-8 py-3.5 rounded-xl transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>

        <div className="bg-brand-canvas rounded-3xl p-8 shadow-sm border border-brand-canvas-soft flex flex-col gap-8 mb-20">
          <div className="flex items-center gap-3 border-b border-brand-canvas-soft pb-4">
            <PiLockKeyDuotone className="w-6 h-6 text-brand-primary" />
            <h3 className="font-display font-bold text-xl text-brand-ink">Security</h3>
          </div>

          <form className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-semibold text-brand-ink mb-2">Current Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full max-w-md bg-brand-canvas-soft/50 border-2 border-transparent focus:border-brand-primary outline-none px-4 py-3.5 rounded-xl text-brand-ink font-medium transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-ink mb-2">New Password</label>
              <input 
                type="password" 
                placeholder="Must be at least 8 characters"
                className="w-full max-w-md bg-brand-canvas-soft/50 border-2 border-transparent focus:border-brand-primary outline-none px-4 py-3.5 rounded-xl text-brand-ink font-medium transition-colors"
              />
            </div>

            <div className="mt-4">
              <button 
                type="button"
                className="bg-brand-canvas-soft text-brand-ink hover:bg-brand-mute/20 font-bold px-8 py-3.5 rounded-xl transition-colors"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>

      </main>
    </div>
  );
}

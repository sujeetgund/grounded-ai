'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  PiCaretLeftBold, 
  PiKeyDuotone,
  PiCpuDuotone,
  PiWarningCircleFill,
  PiCheckCircleFill,
  PiTrashDuotone
} from 'react-icons/pi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  const [isSaved, setIsSaved] = useState(false);
  const [model, setModel] = useState('gpt-4o');
  const [openaiKey, setOpenaiKey] = useState('sk-proj-**********************************');
  const [anthropicKey, setAnthropicKey] = useState('');

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
        <h1 className="font-display font-black text-2xl text-brand-ink">Settings</h1>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl w-full mx-auto p-8 flex flex-col gap-10">
        
        <div>
          <h2 className="font-display font-black text-4xl text-brand-ink mb-2">Workspace Configuration</h2>
          <p className="text-brand-body text-lg font-medium">Manage your agent models, API keys, and workspace preferences.</p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-8">
          
          {/* Model Preferences */}
          <div className="bg-brand-canvas rounded-3xl p-8 shadow-sm border border-brand-canvas-soft flex flex-col gap-8">
            <div className="flex items-center gap-3 border-b border-brand-canvas-soft pb-4">
              <PiCpuDuotone className="w-6 h-6 text-brand-primary" />
              <h3 className="font-display font-bold text-xl text-brand-ink">Agent Models</h3>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-semibold text-brand-ink mb-2">Default LLM Provider</label>
                <Select value={model} onValueChange={(val) => val && setModel(val)}>
                  <SelectTrigger className="w-full max-w-md bg-brand-canvas-soft/50 !h-auto border-2 border-transparent focus:!border-brand-primary outline-none px-4 py-3.5 rounded-xl text-brand-ink font-medium transition-colors cursor-pointer data-[state=open]:!border-brand-primary">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-canvas border border-brand-canvas-soft rounded-xl shadow-lg p-1">
                    <SelectItem value="gpt-4o" className="cursor-pointer hover:bg-brand-canvas-soft focus:bg-brand-canvas-soft text-brand-ink font-medium rounded-lg py-2.5 px-3 mb-1">OpenAI (GPT-4o)</SelectItem>
                    <SelectItem value="gpt-4-turbo" className="cursor-pointer hover:bg-brand-canvas-soft focus:bg-brand-canvas-soft text-brand-ink font-medium rounded-lg py-2.5 px-3 mb-1">OpenAI (GPT-4 Turbo)</SelectItem>
                    <SelectItem value="claude-3-5-sonnet" className="cursor-pointer hover:bg-brand-canvas-soft focus:bg-brand-canvas-soft text-brand-ink font-medium rounded-lg py-2.5 px-3 mb-1">Anthropic (Claude 3.5 Sonnet)</SelectItem>
                    <SelectItem value="claude-3-opus" className="cursor-pointer hover:bg-brand-canvas-soft focus:bg-brand-canvas-soft text-brand-ink font-medium rounded-lg py-2.5 px-3">Anthropic (Claude 3 Opus)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-brand-mute mt-2">This model will be used by default across all collections for generation and evaluation.</p>
              </div>
            </div>
          </div>

          {/* API Keys */}
          <div className="bg-brand-canvas rounded-3xl p-8 shadow-sm border border-brand-canvas-soft flex flex-col gap-8">
            <div className="flex items-center gap-3 border-b border-brand-canvas-soft pb-4">
              <PiKeyDuotone className="w-6 h-6 text-brand-primary" />
              <h3 className="font-display font-bold text-xl text-brand-ink">API Keys</h3>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-semibold text-brand-ink mb-2">OpenAI API Key</label>
                <input 
                  type="password" 
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-brand-canvas-soft/50 border-2 border-transparent focus:border-brand-primary outline-none px-4 py-3.5 rounded-xl text-brand-ink font-medium transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-ink mb-2">Anthropic API Key</label>
                <input 
                  type="password" 
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-brand-canvas-soft/50 border-2 border-transparent focus:border-brand-primary outline-none px-4 py-3.5 rounded-xl text-brand-ink font-medium transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-end gap-4 mt-2">
            {isSaved && (
              <div className="flex items-center gap-2 text-brand-positive font-semibold animate-in fade-in zoom-in duration-300">
                <PiCheckCircleFill className="w-5 h-5" />
                Settings saved successfully.
              </div>
            )}
            <button 
              type="submit"
              className="bg-brand-primary text-brand-on-primary hover:bg-brand-primary-active font-bold px-8 py-3.5 rounded-xl transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="bg-[#fff5f5] rounded-3xl p-8 border border-brand-negative/20 flex flex-col gap-6 mt-8 mb-20">
          <div className="flex items-center gap-3 border-b border-brand-negative/10 pb-4">
            <PiWarningCircleFill className="w-6 h-6 text-brand-negative" />
            <h3 className="font-display font-bold text-xl text-brand-negative">Danger Zone</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-brand-ink mb-1">Delete Workspace</h4>
              <p className="text-sm text-brand-body">Permanently delete your workspace, all collections, and all documents. This action cannot be undone.</p>
            </div>
            <button className="bg-brand-negative-bg hover:bg-brand-negative text-brand-canvas font-bold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 flex-shrink-0">
              <PiTrashDuotone className="w-5 h-5" />
              Delete Workspace
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

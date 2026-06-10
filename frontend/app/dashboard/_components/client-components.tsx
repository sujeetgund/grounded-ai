'use client';

import React, { useState } from "react";
import Link from "next/link";
import {
  PiSignOutDuotone as LogOut,
  PiUserDuotone as User,
  PiGearDuotone as Settings,
  PiPlusBold as Plus,
} from "react-icons/pi";
import { createCollectionAction } from "../actions";

export function DashboardHeader() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="bg-brand-canvas px-8 py-4 flex items-center justify-between border-b border-brand-canvas-soft relative z-20">
      <h1 className="font-display font-black text-2xl text-brand-ink tracking-tight">
        GroundedAI
      </h1>
      <div className="relative">
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center gap-2 hover:bg-brand-canvas-soft p-1.5 pr-4 rounded-full transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-brand-ink text-brand-canvas flex items-center justify-center font-bold text-sm">
            S
          </div>
          <span className="font-semibold text-brand-ink text-sm hidden sm:block">
            Sujeet
          </span>
        </button>

        {isProfileOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-brand-canvas rounded-2xl shadow-xl border border-brand-canvas-soft overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col">
              <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-brand-ink hover:bg-brand-canvas-soft transition-colors text-left">
                <User className="w-4 h-4" />
                Profile
              </Link>
              <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-brand-ink hover:bg-brand-canvas-soft transition-colors text-left">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <div className="h-px bg-brand-canvas-soft my-1"></div>
              <Link href="/login" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-brand-negative hover:bg-brand-negative/10 transition-colors text-left">
                <LogOut className="w-4 h-4" />
                Log out
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export function NewCollectionModalButton() {
  const [isNewCollectionOpen, setIsNewCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim() || isPending) return;
    
    setIsPending(true);
    const formData = new FormData();
    formData.append("name", newCollectionName);
    
    const result = await createCollectionAction(formData);
    setIsPending(false);
    
    if (result.success) {
      setNewCollectionName("");
      setIsNewCollectionOpen(false);
    } else {
      alert(result.error || "Something went wrong");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsNewCollectionOpen(true)}
        className="bg-brand-primary text-brand-on-primary hover:bg-brand-primary-active font-semibold text-base px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm flex-shrink-0"
      >
        <Plus className="w-5 h-5" />
        New Collection
      </button>

      {isNewCollectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40 backdrop-blur-sm p-4">
          <div className="bg-brand-canvas rounded-[24px] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-display font-bold text-2xl text-brand-ink mb-6">
              Create New Collection
            </h3>

            <form
              onSubmit={handleCreateCollection}
              className="flex flex-col gap-5"
            >
              <div>
                <label className="block text-sm font-semibold text-brand-ink mb-2">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="e.g. Q4 Marketing Materials"
                  className="w-full bg-brand-canvas-soft border-2 border-transparent focus:border-brand-primary outline-none px-4 py-3 rounded-xl text-brand-ink font-medium transition-colors"
                  autoFocus
                  disabled={isPending}
                />
              </div>

              <div className="flex gap-3 mt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsNewCollectionOpen(false)}
                  disabled={isPending}
                  className="bg-brand-canvas text-brand-ink border border-brand-mute hover:bg-brand-canvas-soft font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCollectionName.trim() || isPending}
                  className="bg-brand-primary text-brand-on-primary hover:bg-brand-primary-active disabled:opacity-50 font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  {isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

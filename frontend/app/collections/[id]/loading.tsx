import React from 'react';
import { PiSpinnerGapBold } from "react-icons/pi";

export default function CollectionLoading() {
  return (
    <div className="h-screen w-full bg-brand-canvas-soft flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-4">
        <PiSpinnerGapBold className="w-12 h-12 animate-spin text-brand-primary" />
        <span className="text-brand-mute font-semibold text-lg tracking-wide animate-pulse">Loading collection...</span>
      </div>
    </div>
  );
}

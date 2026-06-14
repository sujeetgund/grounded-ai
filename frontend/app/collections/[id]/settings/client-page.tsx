'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  PiCaretLeftBold as ChevronLeft,
  PiUploadSimpleDuotone as Upload,
  PiWarningCircleFill as AlertCircle,
  PiTrashDuotone as Trash2,
  PiSpinnerGapBold as Spinner
} from 'react-icons/pi';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export default function CollectionSettingsClientPage({ collection }: { collection: any }) {
  const router = useRouter();
  
  // Use DB values or fallbacks
  const [collectionName, setCollectionName] = useState(collection.name || '');
  const [description, setDescription] = useState(collection.description || '');
  
  // Settings JSON structure
  const settings = collection.settings || {};
  const [topK, setTopK] = useState([settings.topK || 4]);
  const [similarityThreshold, setSimilarityThreshold] = useState([settings.similarityThreshold || 75]);
  const [faithfulnessThreshold, setFaithfulnessThreshold] = useState([settings.faithfulnessThreshold || 80]);
  const [correctiveLoop, setCorrectiveLoop] = useState(settings.correctiveLoop ?? false);
  const [webFallback, setWebFallback] = useState(settings.webFallback ?? false);
  const [retrievalMode, setRetrievalMode] = useState([settings.retrievalMode || 'hybrid']);
  
  // Modal & Async states
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInputName, setDeleteInputName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/collections/${collection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: collectionName,
          description,
          settings: {
            topK: topK[0],
            similarityThreshold: similarityThreshold[0],
            faithfulnessThreshold: faithfulnessThreshold[0],
            correctiveLoop,
            webFallback,
            retrievalMode: retrievalMode[0]
          }
        })
      });
      if (!res.ok) throw new Error('Failed to save collection');
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteInputName !== collectionName) return;
    setIsDeleting(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/collections/${collection.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete collection');
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Failed to delete collection');
      setIsDeleting(false);
    }
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [benchmarkFileName, setBenchmarkFileName] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setBenchmarkFileName(e.dataTransfer.files[0].name);
    }
  };

  return (
    <div className="min-h-screen bg-brand-canvas-soft flex flex-col font-sans">
      {/* Header NavBar */}
      <header className="bg-brand-canvas px-8 py-4 flex items-center justify-between border-b border-brand-canvas-soft sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href={`/collections/${collection.id}`} className="w-10 h-10 rounded-full bg-brand-canvas-soft flex items-center justify-center hover:bg-brand-primary-pale transition-colors">
            <ChevronLeft className="w-5 h-5 text-brand-ink" />
          </Link>
          <h1 className="font-display font-black text-2xl text-brand-ink">Collection Settings</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand-primary hover:bg-brand-primary-active text-brand-on-primary font-bold text-base px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
        >
          {isSaving ? <Spinner className="w-5 h-5 animate-spin" /> : null}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </header>

      <main className="flex-grow max-w-4xl w-full mx-auto p-8 flex flex-col gap-10">
        
        <Accordion defaultValue={['retrieval']} className="w-full flex flex-col gap-6">
          
          {/* Section 1: Basic Info */}
          <AccordionItem value="basic" className="border-none bg-transparent">
            <AccordionTrigger>Basic Information</AccordionTrigger>
            <AccordionContent>
              <div className="p-8 bg-brand-canvas rounded-2xl border border-brand-canvas-soft flex flex-col gap-6 mt-4">
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-brand-ink text-base">Collection Name</label>
                  <input 
                    type="text" 
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    className="w-full bg-brand-canvas-soft border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 text-brand-ink font-medium outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-brand-ink text-base">Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-brand-canvas-soft border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 text-brand-ink font-medium outline-none transition-all resize-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-brand-ink text-base">Collection Color</label>
                  <div className="flex items-center gap-3">
                    {['#9fe870', '#ffc091', '#38c8ff', '#d03238', '#0e0f0c'].map(color => (
                      <button 
                        key={color}
                        className={`w-10 h-10 rounded-full border-2 ${color === '#9fe870' ? 'border-brand-ink' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 2: Retrieval Settings */}
          <AccordionItem value="retrieval" className="border-none bg-transparent">
            <AccordionTrigger>Retrieval Settings</AccordionTrigger>
            <AccordionContent>
              <div className="p-8 bg-brand-canvas rounded-2xl border border-brand-canvas-soft flex flex-col gap-10 mt-4">
                
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-brand-ink text-base">Retrieval Mode</label>
                  </div>
                  <ToggleGroup value={retrievalMode} onValueChange={(val) => val.length > 0 && setRetrievalMode(val as string[])} className="justify-start">
                    <ToggleGroupItem value="semantic" variant="outline" className="rounded-l-xl">Semantic</ToggleGroupItem>
                    <ToggleGroupItem value="hybrid" variant="outline">Hybrid</ToggleGroupItem>
                    <ToggleGroupItem value="keyword" variant="outline" className="rounded-r-xl">Keyword</ToggleGroupItem>
                  </ToggleGroup>
                  <p className="text-brand-mute text-sm mt-1">Hybrid mode combines dense embeddings with sparse BM25 retrieval for optimal accuracy.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-brand-ink text-base">Top-K Results</label>
                    <span className="font-bold text-brand-primary bg-brand-primary-pale px-3 py-1 rounded-lg">{topK[0]}</span>
                  </div>
                  <Slider value={topK} onValueChange={(val) => setTopK(Array.isArray(val) ? [...val] : [val])} max={20} min={1} step={1} />
                  <p className="text-brand-mute text-sm">Number of chunks to retrieve and inject into the prompt context.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-brand-ink text-base">Similarity Threshold</label>
                    <span className="font-bold text-brand-primary bg-brand-primary-pale px-3 py-1 rounded-lg">{similarityThreshold[0]}%</span>
                  </div>
                  <Slider value={similarityThreshold} onValueChange={(val) => setSimilarityThreshold(Array.isArray(val) ? [...val] : [val])} max={100} min={0} step={1} />
                  <p className="text-brand-mute text-sm">Minimum cosine similarity score required for a chunk to be considered relevant.</p>
                </div>

              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 3: Grounding Settings */}
          <AccordionItem value="grounding" className="border-none bg-transparent">
            <AccordionTrigger>Grounding & Guardrails</AccordionTrigger>
            <AccordionContent>
              <div className="p-8 bg-brand-canvas rounded-2xl border border-brand-canvas-soft flex flex-col gap-10 mt-4">
                
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-brand-ink text-base">Faithfulness Threshold</label>
                    <span className="font-bold text-brand-primary bg-brand-primary-pale px-3 py-1 rounded-lg">{faithfulnessThreshold[0]}%</span>
                  </div>
                  <Slider value={faithfulnessThreshold} onValueChange={(val) => setFaithfulnessThreshold(Array.isArray(val) ? [...val] : [val])} max={100} min={0} step={1} />
                  <p className="text-brand-mute text-sm">Answers scoring below this threshold will trigger a low-confidence warning to the user.</p>
                </div>

                <div className="flex items-center justify-between border-t border-brand-canvas-soft pt-6">
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-brand-ink text-base">Corrective Loop</label>
                    <p className="text-brand-mute text-sm max-w-md">Automatically re-writes the query and re-retrieves if the initial answer fails the faithfulness check.</p>
                  </div>
                  <Switch checked={correctiveLoop} onCheckedChange={setCorrectiveLoop} />
                </div>

                <div className="flex flex-col gap-4 border-t border-brand-canvas-soft pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-brand-ink text-base">Web Fallback</label>
                      <p className="text-brand-mute text-sm max-w-md">Uses Tavily Search API if the answer cannot be found in the local collection.</p>
                    </div>
                    <Switch checked={webFallback} onCheckedChange={setWebFallback} />
                  </div>
                  {webFallback && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <input 
                        type="password" 
                        placeholder="Tavily API Key (tvly-...)"
                        className="w-full bg-brand-canvas-soft border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 text-brand-ink font-medium outline-none transition-all"
                      />
                    </div>
                  )}
                </div>

              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 4: Benchmark Dataset */}
          <AccordionItem value="benchmark" className="border-none bg-transparent">
            <AccordionTrigger>Benchmark Dataset</AccordionTrigger>
            <AccordionContent>
              <div className="p-8 bg-brand-canvas rounded-2xl border border-brand-canvas-soft flex flex-col gap-6 mt-4">
                
                <div className="flex items-center justify-between bg-brand-primary-pale/50 rounded-xl p-4 border border-brand-primary/20">
                  <div className="flex flex-col">
                    <span className="font-bold text-brand-ink">Current Benchmark</span>
                    <span className="text-brand-body text-sm">50 pairs loaded · Last run Oct 24</span>
                  </div>
                  <button className="text-brand-negative font-semibold text-sm hover:underline">
                    Clear Data
                  </button>
                </div>

                <div 
                  className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all overflow-hidden h-48 ${
                    isDragging 
                      ? 'border-brand-primary bg-brand-primary-pale' 
                      : 'border-brand-mute/30 bg-brand-canvas-soft hover:border-brand-primary hover:bg-brand-primary-pale'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                    <div className="w-12 h-12 rounded-full bg-brand-primary-pale text-brand-primary flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    {benchmarkFileName ? (
                      <span className="font-bold text-brand-ink text-lg">{benchmarkFileName}</span>
                    ) : (
                      <>
                        <h3 className="font-semibold text-brand-ink text-base mb-1">Upload QA Pairs</h3>
                        <p className="text-brand-mute text-sm">Drag and drop a .json or .csv file</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json,.csv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setBenchmarkFileName(e.target.files[0].name);
                      }
                    }}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 5: Danger Zone */}
          <AccordionItem value="danger" className="border-none bg-transparent">
            <AccordionTrigger className="text-brand-negative hover:text-brand-negative-deep">Danger Zone</AccordionTrigger>
            <AccordionContent>
              <div className="p-8 bg-brand-negative-bg rounded-2xl border border-brand-negative/30 flex flex-col gap-6 mt-4">
                
                <div className="flex items-center justify-between border-b border-brand-negative/20 pb-6">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-brand-canvas text-base">Clear All Documents</span>
                    <span className="text-brand-negative font-medium text-sm">Removes all indexed files but keeps settings intact.</span>
                  </div>
                  <button className="bg-transparent border border-brand-negative text-brand-negative hover:bg-brand-negative hover:text-brand-canvas px-6 py-3 rounded-xl font-bold transition-colors">
                    Clear Data
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-brand-canvas text-base">Delete Collection</span>
                    <span className="text-brand-negative font-medium text-sm">Permanently removes this collection and all associated data.</span>
                  </div>
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-brand-negative text-brand-canvas hover:bg-brand-negative-darkest px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete Permanently
                  </button>
                </div>

              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-ink/40 backdrop-blur-sm p-4">
          <div className="bg-brand-canvas max-w-md w-full rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-full bg-brand-negative/10 flex items-center justify-center mb-6">
              <AlertCircle className="w-7 h-7 text-brand-negative" />
            </div>
            
            <h2 className="font-display font-black text-2xl text-brand-ink mb-2">Delete Collection?</h2>
            <p className="text-brand-body font-medium mb-6">
              This action cannot be undone. This will permanently delete the <strong className="text-brand-ink">"{collectionName}"</strong> collection and all of its indexed documents.
            </p>
            
            <div className="mb-8">
              <label className="block text-sm font-semibold text-brand-ink mb-2">
                Please type <span className="text-brand-negative font-black">{collectionName}</span> to confirm.
              </label>
              <input 
                type="text" 
                value={deleteInputName}
                onChange={(e) => setDeleteInputName(e.target.value)}
                className="w-full bg-brand-canvas-soft border-2 border-transparent focus:border-brand-negative rounded-xl px-4 py-3 text-brand-ink font-medium outline-none transition-all"
                placeholder={collectionName}
              />
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDelete}
                disabled={deleteInputName !== collectionName || isDeleting}
                className="w-full bg-brand-negative text-brand-canvas hover:bg-brand-negative-darkest disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg px-6 py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? <Spinner className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                {isDeleting ? 'Deleting...' : 'I understand, delete this collection'}
              </button>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteInputName('');
                }}
                disabled={isDeleting}
                className="w-full bg-brand-canvas-soft text-brand-ink hover:bg-brand-canvas-soft/80 font-bold text-lg px-6 py-3.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

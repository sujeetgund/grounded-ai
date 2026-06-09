'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  PiCaretLeftBold as ChevronLeft,
  PiUploadSimpleDuotone as Upload,
  PiFileTextDuotone as FileText,
  PiChatCircleTextDuotone as MessageSquare,
  PiGearDuotone as Settings,
  PiDotsThreeVerticalBold as MoreVertical,
  PiTrashDuotone as Trash2,
  PiCheckCircleFill as CheckCircle2,
  PiWarningCircleFill as AlertCircle,
  PiSpinnerGapBold as Spinner,
  PiDotsThreeBold,
  PiChartLineUpBold as ChartLineUp,
  PiClockBold as Clock,
  PiFilePdfDuotone as FilePdf
} from 'react-icons/pi';

type Document = {
  id: string;
  name: string;
  chunks: number | null;
  status: 'ready' | 'processing' | 'indexing' | 'failed';
  progress?: number;
  date: string;
};

export default function CollectionDetailPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [documents, setDocuments] = useState<Document[]>([
    { id: '1', name: 'Q3_Financial_Report.pdf', chunks: 147, status: 'ready', date: 'Oct 12, 2026' },
    { id: '2', name: 'User_Research_2023.pdf', chunks: 312, status: 'ready', date: 'Oct 15, 2026' },
    { id: '3', name: 'Architecture_RFC.md', chunks: null, status: 'indexing', progress: 64, date: 'Oct 18, 2026' },
    { id: '4', name: 'Security_Audit.pdf', chunks: null, status: 'processing', date: 'Oct 20, 2026' },
  ]);

  const [isDeleteDocsModalOpen, setIsDeleteDocsModalOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [collectionName, setCollectionName] = useState('Product Strategy');

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
      simulateUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateUpload(Array.from(e.target.files));
    }
  };

  const simulateUpload = (files: File[]) => {
    setIsUploading(true);
    
    // Add dummy processing files
    const newDocs = files.map((file, idx) => ({
      id: `temp-${Date.now()}-${idx}`,
      name: file.name,
      chunks: null,
      status: 'processing' as const,
      date: 'Just now'
    }));
    
    setDocuments(prev => [...newDocs, ...prev]);

    // Simulate completion after 2 seconds
    setTimeout(() => {
      setDocuments(prev => prev.map(doc => {
        if (doc.id.startsWith('temp-')) {
          return { ...doc, status: 'ready' };
        }
        return doc;
      }));
      setIsUploading(false);
    }, 2000);
  };

  const handleDeleteSelected = () => {
    setDocuments(prev => prev.filter(doc => !selectedDocs.has(doc.id)));
    setSelectedDocs(new Set());
    setIsDeleteDocsModalOpen(false);
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === documents.length && documents.length > 0) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(documents.map(d => d.id)));
    }
  };

  const toggleSelectDoc = (id: string) => {
    const newSet = new Set(selectedDocs);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedDocs(newSet);
  };

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  return (
    <div className="min-h-screen bg-brand-canvas-soft font-sans flex flex-col">
      


      {/* Delete Docs Modal */}
      {isDeleteDocsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40 backdrop-blur-sm p-4">
          <div className="bg-brand-canvas rounded-[24px] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-display font-bold text-2xl text-brand-ink mb-4">Delete Documents?</h3>
            <p className="text-brand-body mb-8 font-medium">
              Are you sure you want to delete {selectedDocs.size} selected document{selectedDocs.size > 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsDeleteDocsModalOpen(false)}
                className="bg-brand-canvas text-brand-ink border border-brand-mute hover:bg-brand-canvas-soft font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteSelected}
                className="bg-brand-negative-bg text-brand-canvas hover:bg-brand-negative-deep font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header NavBar */}
      <header className="bg-brand-canvas px-8 py-4 flex items-center justify-between border-b border-brand-canvas-soft">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="w-10 h-10 rounded-full bg-brand-canvas-soft flex items-center justify-center hover:bg-brand-primary-pale transition-colors">
            <ChevronLeft className="w-5 h-5 text-brand-ink" />
          </Link>
          <h1 className="font-display font-black text-2xl text-brand-ink">GroundedAI</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/collections/123/eval"
            className="bg-brand-canvas-soft text-brand-ink hover:bg-brand-canvas-soft/80 font-semibold text-base px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <ChartLineUp className="w-5 h-5" />
            Evals 
            <span className="text-brand-mute">·</span> 
            <span className="text-brand-ink font-bold bg-brand-canvas px-2 py-0.5 rounded-md shadow-sm">92%</span>
          </Link>
          <Link 
            href="/collections/123/chat"
            className="bg-brand-primary text-brand-on-primary hover:bg-brand-primary-active font-semibold text-base px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Chat
          </Link>
          <Link 
            href="/collections/123/settings"
            className="bg-brand-canvas text-brand-ink hover:bg-brand-canvas-soft p-2 rounded-full flex items-center justify-center transition-colors"
          >
            <Settings className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl w-full mx-auto p-8 flex flex-col gap-8">
        
        {/* Collection Hero */}
        <div className="bg-brand-ink rounded-3xl p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-primary opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -right-10 w-80 h-80 bg-brand-primary opacity-15 rounded-full blur-[80px]"></div>
          
          <div className="relative z-10 flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2 text-brand-canvas-soft/80 mb-2">
              <span className="uppercase text-xs font-bold tracking-widest">Collection</span>
            </div>
            <h2 className="font-display font-black text-5xl text-brand-canvas">{collectionName}</h2>
            <p className="text-brand-canvas-soft/70 text-lg mt-2 truncate w-full">
              Contains user research, architecture RFCs, and quarterly financial reports.
            </p>
            <div className="text-brand-primary font-bold text-sm mt-1">
              4 documents · 3.7k chunks indexed
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <div 
          className={`relative border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center transition-all overflow-hidden group ${
            isDragging 
              ? 'border-brand-primary bg-brand-primary-pale h-64' 
              : 'border-brand-mute/30 bg-brand-canvas hover:border-brand-primary hover:bg-brand-primary-pale h-20 hover:h-64'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Compact State */}
          <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-100 group-hover:opacity-0 transition-opacity duration-200">
            <Upload className="w-6 h-6 text-brand-mute" />
            <span className="font-semibold text-brand-mute text-lg">Drag & drop files to upload to this collection</span>
          </div>

          {/* Expanded State */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 rounded-full bg-brand-primary-pale text-brand-primary flex items-center justify-center mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-2xl text-brand-ink mb-2">
              Upload new documents
            </h3>
            <p className="text-brand-body mb-6 max-w-md">
              Drag and drop your PDFs, Markdown, or text files here to add them to this collection's knowledge base.
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-brand-canvas-soft text-brand-ink hover:bg-brand-primary-pale font-bold px-6 py-3 rounded-xl transition-colors"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Browse Files'}
            </button>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            multiple 
            accept=".pdf,.md,.txt,.csv"
          />
        </div>

        {/* Document List */}
        <div className="flex flex-col gap-4 mb-20">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-display font-bold text-2xl text-brand-ink">
              Documents ({documents.length})
            </h3>
            <div className="text-brand-mute text-sm font-medium">
              Sorted by newest
            </div>
          </div>

          <div className="bg-brand-canvas rounded-3xl shadow-sm border border-brand-canvas-soft overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-brand-canvas-soft/50 border-b border-brand-canvas-soft text-xs font-bold text-brand-mute uppercase tracking-wider">
              <div className="col-span-1 flex items-center justify-center">
                <input 
                  type="checkbox" 
                  checked={documents.length > 0 && selectedDocs.size === documents.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-brand-mute/50 text-brand-primary focus:ring-brand-primary bg-brand-canvas cursor-pointer"
                />
              </div>
              <div className="col-span-5">File Name</div>
              <div className="col-span-2">Chunks Indexed</div>
              <div className="col-span-2">Date Added</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            <div className="flex flex-col">
              {documents.length === 0 ? (
                <div className="p-12 text-center text-brand-mute">
                  No documents uploaded yet.
                </div>
              ) : (
                documents.map((doc, idx) => (
                  <div 
                    key={doc.id} 
                    className={`grid grid-cols-12 gap-4 px-8 py-5 items-center group transition-colors ${
                      idx !== documents.length - 1 ? 'border-b border-brand-canvas-soft' : ''
                    } ${selectedDocs.has(doc.id) ? 'bg-brand-primary/5 border-l-2 border-brand-primary' : 'hover:bg-brand-canvas-soft/30 border-l-2 border-transparent'}`}
                  >
                    <div className="col-span-1 flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={selectedDocs.has(doc.id)}
                        onChange={() => toggleSelectDoc(doc.id)}
                        className="w-4 h-4 rounded border-brand-mute/50 text-brand-primary focus:ring-brand-primary bg-brand-canvas cursor-pointer"
                      />
                    </div>
                    <div className="col-span-5 flex items-center gap-4">
                      {doc.name.endsWith('.pdf') ? (
                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
                          <FilePdf className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <span className="font-semibold text-brand-ink truncate">{doc.name}</span>
                    </div>
                    
                    <div className="col-span-2 text-brand-body text-sm font-medium">
                      {doc.chunks !== null ? `${doc.chunks} chunks` : '-'}
                    </div>
                    
                    <div className="col-span-2 text-brand-body text-sm font-medium">
                      {doc.date}
                    </div>
                    
                    <div className="col-span-2 flex items-center justify-end">
                      {doc.status === 'ready' ? (
                        <div className="flex items-center gap-2 text-brand-ink text-sm font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-brand-positive" />
                          Ready
                        </div>
                      ) : doc.status === 'indexing' ? (
                        <div className="flex flex-col items-end gap-1.5 w-32">
                          <div className="flex items-center gap-1.5 text-brand-ink text-sm font-semibold">
                            <Clock className="w-3.5 h-3.5 text-brand-warning" />
                            Indexing
                            <span className="text-brand-mute font-medium text-xs">({doc.progress}%)</span>
                          </div>
                          <div className="w-full bg-brand-canvas-soft h-1.5 rounded-full overflow-hidden">
                            <div className="bg-brand-warning h-full transition-all duration-500" style={{ width: `${doc.progress}%` }}></div>
                          </div>
                        </div>
                      ) : doc.status === 'processing' ? (
                        <div className="flex items-center gap-2 text-brand-ink text-sm font-semibold">
                          <Spinner className="w-4 h-4 animate-spin text-brand-ink" />
                          Processing
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-brand-ink text-sm font-semibold">
                          <AlertCircle className="w-4 h-4 text-brand-negative" />
                          Failed
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Floating Action Bar for Selection */}
        {selectedDocs.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-brand-ink text-brand-canvas py-4 px-6 rounded-full shadow-2xl z-50 flex items-center gap-6 animate-in slide-in-from-bottom-8 duration-300">
            <span className="font-semibold text-sm">
              {selectedDocs.size} document{selectedDocs.size > 1 ? 's' : ''} selected
            </span>
            <div className="w-px h-4 bg-brand-mute/30"></div>
            <button 
              onClick={() => setIsDeleteDocsModalOpen(true)}
              className="flex items-center gap-2 text-brand-negative font-bold text-sm hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

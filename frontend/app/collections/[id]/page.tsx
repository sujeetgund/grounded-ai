import React from "react";
import { notFound } from "next/navigation";
import { CollectionClientPage } from "./client-page";

// Next.js config to ensure dynamic rendering
export const dynamic = 'force-dynamic';

async function getCollectionDetails(id: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  
  try {
    const res = await fetch(`${backendUrl}/collections/${id}`, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch collection: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch collection:", error);
    return null;
  }
}

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCollectionDetails(id);
  
  if (!data) {
    notFound();
  }
  
  const { documents, ...collectionInfo } = data;
  
  return (
    <CollectionClientPage 
      collectionId={id} 
      collection={collectionInfo} 
      initialDocuments={documents} 
    />
  );
}

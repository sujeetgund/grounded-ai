import { notFound } from "next/navigation";
import ChatClientPage from "./client-page";

export const dynamic = "force-dynamic";

async function getCollectionDetails(collectionId: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${backendUrl}/collections/${collectionId}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch collection: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const collection = await getCollectionDetails(resolvedParams.id);

  if (!collection) {
    notFound();
  }

  return <ChatClientPage collection={collection} />;
}

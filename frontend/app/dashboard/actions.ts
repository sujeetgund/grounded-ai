'use server'

import { revalidatePath } from 'next/cache'

export async function createCollectionAction(formData: FormData) {
  const name = formData.get('name') as string
  if (!name) return { error: "Name is required" }
  
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  
  try {
    const res = await fetch(`${backendUrl}/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        description: "Newly created collection.",
        settings: {}
      })
    })
    
    if (!res.ok) {
      return { error: "Failed to create collection" }
    }
    
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error("Error creating collection:", error)
    return { error: "Network error" }
  }
}

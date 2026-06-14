from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from models import DocumentChunk, Document
from database import SessionLocal
from config import settings
from langchain_huggingface import HuggingFaceEndpointEmbeddings

import requests

# Reuse the same embedding model as the worker
embeddings_model = HuggingFaceEndpointEmbeddings(
    model="BAAI/bge-small-en-v1.5",
    huggingfacehub_api_token=settings.HF_TOKEN
)

def rerank_documents(query: str, documents: List[Dict[str, Any]], top_k: int = 5, similarity_threshold: float = 0.0) -> List[Dict[str, Any]]:
    if not documents:
        return []
        
    if not settings.COHERE_API_KEY:
        print("Cohere API Key not found. Falling back to original document ordering.")
        return documents[:top_k]
        
    API_URL = "https://api.cohere.com/v2/rerank"
    headers = {
        "Authorization": f"Bearer {settings.COHERE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Limit content length to avoid exceeding API limits
    payload = {
        "model": "rerank-english-v3.0",
        "query": query,
        "documents": [doc["content"][:2000] for doc in documents],
        "top_n": len(documents),
        "return_documents": False
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=10)
        if response.status_code == 200:
            results = response.json()
            # Cohere returns: {"id": "...", "results": [{"index": i, "relevance_score": 0.9}, ...]}
            for res in results.get("results", []):
                idx = res["index"]
                documents[idx]["rerank_score"] = res["relevance_score"]
                
            # Filter by threshold and sort
            filtered_docs = [doc for doc in documents if doc.get("rerank_score", 0.0) >= similarity_threshold]
            filtered_docs.sort(key=lambda x: x.get("rerank_score", 0.0), reverse=True)
            
            return filtered_docs[:top_k]
        else:
            print(f"Cohere API Reranking failed: {response.text}")
            # Fallback to original order if reranking fails
            return documents[:top_k]
    except Exception as e:
        print(f"Cohere API Reranking error: {e}")
        return documents[:top_k]

def hybrid_search(queries: List[str], collection_id: str, top_k: int = 10, similarity_threshold: float = 0.0, retrieval_mode: str = 'hybrid') -> List[Dict[str, Any]]:
    """
    Executes search using Vector Cosine Similarity (pgvector) and/or Full-Text Search (tsvector)
    based on retrieval_mode, then pools and reranks the results.
    """
    db: Session = SessionLocal()
    
    try:
        chunk_map = {}
        
        # We need a bit more docs from initial retrieval before reranking
        initial_k = max(20, top_k * 3) 
        
        for query in queries:
            if not query or query == "CHITCHAT":
                continue
                
            vector_results = []
            keyword_results = []
            
            # Vector Search
            if retrieval_mode in ['hybrid', 'vector']:
                query_embedding = embeddings_model.embed_query(query)
                vector_results = db.query(DocumentChunk, Document).join(
                    Document, DocumentChunk.document_id == Document.id
                ).filter(
                    Document.collection_id == collection_id
                ).order_by(
                    DocumentChunk.embedding.cosine_distance(query_embedding)
                ).limit(initial_k).all()
            
            # Keyword Search
            if retrieval_mode in ['hybrid', 'keyword']:
                tsquery_str = "websearch_to_tsquery('english', :query)"
                keyword_results = db.query(DocumentChunk, Document).join(
                    Document, DocumentChunk.document_id == Document.id
                ).filter(
                    Document.collection_id == collection_id,
                    DocumentChunk.text_search_vector.op("@@")(text(tsquery_str).bindparams(query=query))
                ).order_by(
                    text(f"ts_rank(text_search_vector, {tsquery_str}) DESC").bindparams(query=query)
                ).limit(initial_k).all()
            
            # Pool and deduplicate
            for chunk, doc in vector_results + keyword_results:
                if chunk.id not in chunk_map:
                    chunk_map[chunk.id] = {
                        "id": chunk.id,
                        "content": chunk.content,
                        "document_name": doc.filename,
                        "page_number": chunk.page_number
                    }
                    
        pooled_docs = list(chunk_map.values())
        
        # Use the first query (original query) as the anchor for reranking
        main_query = queries[0] if queries else ""
        return rerank_documents(main_query, pooled_docs, top_k=top_k, similarity_threshold=similarity_threshold)

    finally:
        db.close()

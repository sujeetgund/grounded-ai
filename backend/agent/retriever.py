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

def rerank_documents(query: str, documents: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
    if not documents:
        return []
        
    API_URL = "https://api-inference.huggingface.co/models/cross-encoder/nli-deberta-v3-base"
    headers = {"Authorization": f"Bearer {settings.HF_TOKEN}"}
    
    # Limit content length to avoid exceeding API token limits
    payload = {
        "inputs": [{"text": query, "text_pair": doc["content"][:2000]} for doc in documents]
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=10)
        if response.status_code == 200:
            results = response.json()
            for i, doc in enumerate(documents):
                doc_results = results[i]
                entailment_score = 0.0
                for label_score in doc_results:
                    if label_score.get("label", "").lower() == "entailment":
                        entailment_score = label_score.get("score", 0.0)
                        break
                doc["rerank_score"] = entailment_score
                
            documents.sort(key=lambda x: x.get("rerank_score", 0.0), reverse=True)
            return documents[:top_k]
        else:
            print(f"HF API Reranking failed: {response.text}")
            # Fallback to original order if reranking fails
            return documents[:top_k]
    except Exception as e:
        print(f"HF API Reranking error: {e}")
        return documents[:top_k]

def hybrid_search(queries: List[str], collection_id: str, k: int = 10) -> List[Dict[str, Any]]:
    """
    Executes a hybrid search using both Vector Cosine Similarity (pgvector)
    and Full-Text Search (tsvector) for multiple queries, pooling the results.
    """
    db: Session = SessionLocal()
    
    try:
        chunk_map = {}
        
        for query in queries:
            if not query or query == "CHITCHAT":
                continue
                
            query_embedding = embeddings_model.embed_query(query)
            
            # Vector Search
            vector_results = db.query(DocumentChunk, Document).join(
                Document, DocumentChunk.document_id == Document.id
            ).filter(
                Document.collection_id == collection_id
            ).order_by(
                DocumentChunk.embedding.cosine_distance(query_embedding)
            ).limit(k).all()
            
            # Keyword Search
            tsquery_str = "websearch_to_tsquery('english', :query)"
            keyword_results = db.query(DocumentChunk, Document).join(
                Document, DocumentChunk.document_id == Document.id
            ).filter(
                Document.collection_id == collection_id,
                DocumentChunk.text_search_vector.op("@@")(text(tsquery_str).bindparams(query=query))
            ).order_by(
                text(f"ts_rank(text_search_vector, {tsquery_str}) DESC").bindparams(query=query)
            ).limit(k).all()
            
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
        return rerank_documents(main_query, pooled_docs, top_k=6)

    finally:
        db.close()

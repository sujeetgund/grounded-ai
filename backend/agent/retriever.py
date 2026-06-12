from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from models import DocumentChunk, Document
from database import SessionLocal
from config import settings
from langchain_huggingface import HuggingFaceEndpointEmbeddings

# Reuse the same embedding model as the worker
embeddings_model = HuggingFaceEndpointEmbeddings(
    model="sentence-transformers/all-MiniLM-L6-v2",
    huggingfacehub_api_token=settings.HF_TOKEN
)

def hybrid_search(query: str, collection_id: str, k: int = 5) -> List[Dict[str, Any]]:
    """
    Executes a hybrid search using both Vector Cosine Similarity (pgvector)
    and Full-Text Search (tsvector), combining results with Reciprocal Rank Fusion (RRF).
    """
    db: Session = SessionLocal()
    
    try:
        # 1. Generate query embedding
        query_embedding = embeddings_model.embed_query(query)
        
        # We need to filter chunks by the documents belonging to the given collection.
        # This requires joining DocumentChunk with Document.
        
        # 2. Vector Search (Semantic)
        vector_results = db.query(DocumentChunk, Document).join(
            Document, DocumentChunk.document_id == Document.id
        ).filter(
            Document.collection_id == collection_id
        ).order_by(
            DocumentChunk.embedding.cosine_distance(query_embedding)
        ).limit(k * 2).all()
        
        # 3. Keyword Search (BM25 / tsvector)
        # Using websearch_to_tsquery for better handling of natural language user queries
        tsquery_str = "websearch_to_tsquery('english', :query)"
        keyword_results = db.query(DocumentChunk, Document).join(
            Document, DocumentChunk.document_id == Document.id
        ).filter(
            Document.collection_id == collection_id,
            DocumentChunk.text_search_vector.op("@@")(text(tsquery_str).bindparams(query=query))
        ).order_by(
            text(f"ts_rank(text_search_vector, {tsquery_str}) DESC").bindparams(query=query)
        ).limit(k * 2).all()
        
        # 4. Reciprocal Rank Fusion (RRF)
        # RRF Score = 1 / (60 + rank)
        rrf_k = 60
        scores = {}
        chunk_map = {}
        
        # Process vector ranks
        for rank, (chunk, doc) in enumerate(vector_results):
            if chunk.id not in scores:
                scores[chunk.id] = 0
                chunk_map[chunk.id] = (chunk, doc)
            scores[chunk.id] += 1.0 / (rrf_k + rank + 1)
            
        # Process keyword ranks
        for rank, (chunk, doc) in enumerate(keyword_results):
            if chunk.id not in scores:
                scores[chunk.id] = 0
                chunk_map[chunk.id] = (chunk, doc)
            scores[chunk.id] += 1.0 / (rrf_k + rank + 1)
            
        # 5. Sort by RRF score and get top k
        sorted_chunk_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)[:k]
        
        final_docs = []
        for cid in sorted_chunk_ids:
            chunk, doc = chunk_map[cid]
            final_docs.append({
                "id": chunk.id,
                "content": chunk.content,
                "document_name": doc.filename,
                "page_number": chunk.page_number,
                "rrf_score": scores[cid]
            })
            
        return final_docs

    finally:
        db.close()

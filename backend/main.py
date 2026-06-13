import asyncio
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Request
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session
from collections import defaultdict
import json

from config import settings
from database import get_db
from models import Document, DocumentStatus, Collection, DocumentChunk
from schemas import CollectionCreate, CollectionResponse, CollectionDetailResponse, DocumentResponse, ChatRequest
from s3_utils import upload_file_to_s3
from arq import create_pool
from worker import redis_settings

# In-memory dictionary to hold event queues for each document's SSE streams
doc_event_queues = defaultdict(list)

async def listen_to_redis():
    import redis.asyncio as aioredis
    redis_client = aioredis.from_url(settings.REDIS_URL, max_connections=2)
    pubsub = redis_client.pubsub()
    await pubsub.subscribe("global_doc_events")
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                doc_id = data["doc_id"]
                status = data["status"]
                
                # Fan out to all connected clients for this doc
                for q in doc_event_queues[doc_id]:
                    await q.put(status)
    except asyncio.CancelledError:
        pass
    finally:
        await pubsub.unsubscribe()
        await pubsub.close()
        await redis_client.aclose()

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis_pool = await create_pool(redis_settings)
    task = asyncio.create_task(listen_to_redis())
    yield
    task.cancel()
    await app.state.redis_pool.close()

app = FastAPI(title="GroundedAI API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/documents/upload")
async def upload_document(
    request: Request, 
    collection_id: str = Form(...), 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    try:
        s3_key = upload_file_to_s3(file.file, file.filename)
        
        doc = Document(filename=file.filename, s3_key=s3_key, status=DocumentStatus.PROCESSING, collection_id=collection_id)
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        # Enqueue background task
        await request.app.state.redis_pool.enqueue_job('process_document', doc.id)
        
        return {"document_id": doc.id, "status": doc.status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{document_id}/events")
async def document_events(request: Request, document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    async def event_generator():
        # First send the current status from DB immediately
        current_status = doc.status.value
        yield {
            "event": "status_update",
            "data": current_status
        }
        
        if doc.status in [DocumentStatus.READY, DocumentStatus.FAILED]:
            return

        # Create a queue for this specific SSE client
        q = asyncio.Queue()
        doc_event_queues[document_id].append(q)
        
        try:
            while True:
                if await request.is_disconnected():
                    break
                
                # Wait for the next status update from the Redis fan-out task
                try:
                    status_str = await asyncio.wait_for(q.get(), timeout=1.0)
                    yield {
                        "event": "status_update",
                        "data": status_str
                    }
                    if status_str in [DocumentStatus.READY.value, DocumentStatus.FAILED.value]:
                        break
                except asyncio.TimeoutError:
                    # Timeout just allows us to loop back and check request.is_disconnected()
                    continue
        finally:
            doc_event_queues[document_id].remove(q)
            if not doc_event_queues[document_id]:
                del doc_event_queues[document_id]

    return EventSourceResponse(event_generator())

@app.post("/collections", response_model=CollectionResponse)
def create_collection(collection: CollectionCreate, db: Session = Depends(get_db)):
    db_collection = Collection(
        name=collection.name,
        description=collection.description,
        settings=collection.settings
    )
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    
    # Format response
    response = CollectionResponse.model_validate(db_collection)
    response.docCount = 0
    return response

@app.get("/collections", response_model=List[CollectionResponse])
def get_collections(db: Session = Depends(get_db)):
    collections = db.query(Collection).order_by(Collection.created_at.desc()).all()
    
    # Calculate doc counts manually for now
    results = []
    for col in collections:
        count = db.query(Document).filter(Document.collection_id == col.id).count()
        response = CollectionResponse.model_validate(col)
        response.docCount = count
        results.append(response)
        
    return results

@app.get("/collections/{collection_id}", response_model=CollectionDetailResponse)
def get_collection(collection_id: str, db: Session = Depends(get_db)):
    col = db.query(Collection).filter(Collection.id == collection_id).first()
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    docs = db.query(Document).filter(Document.collection_id == col.id).order_by(Document.created_at.desc()).all()
    
    # We need to map Document to DocumentResponse and manually calculate chunks
    doc_responses = []
    for doc in docs:
        chunk_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()
        doc_resp = DocumentResponse(
            id=doc.id,
            filename=doc.filename,
            status=doc.status,
            collection_id=doc.collection_id,
            created_at=doc.created_at,
            chunks=chunk_count if doc.status == DocumentStatus.READY else None
        )
        doc_responses.append(doc_resp)
        
    response = CollectionDetailResponse(
        id=col.id,
        name=col.name,
        description=col.description,
        settings=col.settings,
        created_at=col.created_at,
        docCount=len(docs),
        groundingScore=0,
        documents=doc_responses
    )
    return response

@app.post("/collections/{collection_id}/chat")
async def chat_with_collection(collection_id: str, request: Request, chat_request: ChatRequest):
    from agent.graph import agent_app
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
    
    # Convert messages
    langchain_messages = []
    for msg in chat_request.messages:
        if msg.role == "user":
            langchain_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            langchain_messages.append(AIMessage(content=msg.content))
        elif msg.role == "system":
            langchain_messages.append(SystemMessage(content=msg.content))
            
    initial_state = {
        "messages": langchain_messages,
        "collection_id": collection_id,
        "trace_steps": [],
        "iterations": 0
    }
    
    async def chat_generator():
        final_generation = None
        final_grounded = True
        final_documents = []
        final_fallback = False
        
        try:
            async for event in agent_app.astream(initial_state):
                if await request.is_disconnected():
                    break
                    
                node_name = list(event.keys())[0]
                state_update = event[node_name]
                
                if "trace_steps" in state_update and len(state_update["trace_steps"]) > 0:
                    latest_step = state_update["trace_steps"][-1]
                    yield {
                        "event": "trace",
                        "data": json.dumps(latest_step)
                    }
                    
                if "documents" in state_update:
                    final_documents = state_update["documents"]
                    
                if "generation" in state_update:
                    final_generation = state_update["generation"]
                    
                if "is_grounded" in state_update:
                    final_grounded = state_update["is_grounded"]
                    
                if "web_fallback_needed" in state_update:
                    final_fallback = state_update["web_fallback_needed"]
                    
            if final_generation:
                # Map documents to the sources format expected by the frontend
                sources = []
                for doc in final_documents:
                    sources.append({
                        "name": doc.get("document_name", "Unknown Source"),
                        "page": doc.get("page_number", None),
                        "type": "web" if str(doc.get("id", "")).startswith("web_") else "doc",
                        "url": doc.get("url", None)
                    })
                    
                yield {
                    "event": "message",
                    "data": json.dumps({
                        "content": final_generation,
                        "is_grounded": final_grounded,
                        "is_fallback": final_fallback,
                        "sources": sources
                    })
                }
        except Exception as e:
            print(f"Graph execution error: {e}")
            yield {
                "event": "error",
                "data": json.dumps({"detail": str(e)})
            }
            
    return EventSourceResponse(chat_generator())


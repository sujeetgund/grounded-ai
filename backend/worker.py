import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"

import asyncio
import tempfile
from urllib.parse import urlparse
from arq.connections import RedisSettings
from config import settings
from database import SessionLocal
from models import Document, DocumentChunk, DocumentStatus
from s3_utils import download_file_from_s3
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.chunking import HierarchicalChunker
from langchain_huggingface import HuggingFaceEndpointEmbeddings

import redis
import json

url = urlparse(settings.REDIS_URL)
redis_settings = RedisSettings(
    host=url.hostname,
    port=url.port,
    password=url.password,
    ssl=url.scheme == "rediss"
)

embeddings_model = HuggingFaceEndpointEmbeddings(
    model="sentence-transformers/all-MiniLM-L6-v2",
    huggingfacehub_api_token=settings.HF_TOKEN
)


# Create a single redis connection pool for the worker process, with max 5 connections
redis_client = redis.Redis.from_url(settings.REDIS_URL, max_connections=5)

def publish_status(doc_id: str, status: DocumentStatus):
    try:
        redis_client.publish("global_doc_events", json.dumps({"doc_id": doc_id, "status": status.value}))
    except Exception as e:
        print(f"Redis publish error: {e}")

def process_document_sync(document_id: str):
    db = SessionLocal()
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        db.close()
        return

    doc.status = DocumentStatus.PROCESSING
    db.commit()
    publish_status(doc.id, doc.status)

    tmp_dir = tempfile.gettempdir()
    temp_file_path = os.path.join(tmp_dir, f"{doc.id}_{doc.filename}")
    
    try:
        print(f"Downloading {doc.filename} from S3...")
        download_file_from_s3(doc.s3_key, temp_file_path)
        
        print(f"Parsing {doc.filename} with Docling (OCR disabled)...")
        pipeline_options = PdfPipelineOptions(do_ocr=False)
        converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
            }
        )
        result = converter.convert(temp_file_path)
        
        print(f"Chunking {doc.filename}...")
        chunker = HierarchicalChunker()
        chunks = list(chunker.chunk(result.document))
        
        doc.status = DocumentStatus.INDEXING
        db.commit()
        publish_status(doc.id, doc.status)

        texts_to_embed = [chunk.text for chunk in chunks]
        
        print(f"Embedding {len(texts_to_embed)} chunks via HF Endpoint...")
        embeddings = []
        batch_size = 32
        for i in range(0, len(texts_to_embed), batch_size):
            batch = texts_to_embed[i:i + batch_size]
            batch_embeddings = embeddings_model.embed_documents(batch)
            embeddings.extend(batch_embeddings)
        
        print(f"Saving {len(chunks)} chunks to PostgreSQL...")
        for idx, chunk in enumerate(chunks):
            page_no = None
            if chunk.meta and chunk.meta.doc_items:
                for item in chunk.meta.doc_items:
                    if hasattr(item, 'prov') and item.prov:
                        for p in item.prov:
                            if hasattr(p, 'page_no'):
                                page_no = p.page_no
                                break
                    if page_no:
                        break

            doc_chunk = DocumentChunk(
                document_id=doc.id,
                chunk_index=idx,
                page_number=page_no,
                content=chunk.text,
                embedding=embeddings[idx]
            )
            db.add(doc_chunk)
            
        doc.status = DocumentStatus.READY
        db.commit()
        publish_status(doc.id, doc.status)
        print(f"Document {doc.filename} processing complete.")

    except Exception as e:
        print(f"Error processing document: {e}")
        db.rollback()
        doc.status = DocumentStatus.FAILED
        db.commit()
        publish_status(doc.id, doc.status)
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        db.close()


async def process_document(ctx, document_id: str):
    await asyncio.to_thread(process_document_sync, document_id)


class WorkerSettings:
    functions = [process_document]
    redis_settings = redis_settings

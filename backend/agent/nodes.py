import json
import urllib
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_groq import ChatGroq
from config import settings
from .state import AgentState
from .retriever import hybrid_search

# Initialize models
grader_llm = ChatGroq(model="llama-3.1-8b-instant", api_key=settings.GROQ_API_KEY)
# We use the smarter model for generation
generator_llm = ChatGroq(model="openai/gpt-oss-120b", api_key=settings.GROQ_API_KEY)

def route_and_rewrite_node(state: AgentState) -> AgentState:
    """
    Decides if the message requires RAG or is just chit-chat.
    If it requires RAG, rewrites the latest query into a standalone query.
    """
    messages = state["messages"]
    if not messages:
        return {"queries": []}
        
    latest_msg = messages[-1].content
    
    prompt = f"""You are a query router and rewriter for a Retrieval-Augmented Generation (RAG) system.
Look at the following conversation history and the latest user message.

If the latest message is ONLY a simple greeting (like "hello", "hi", "how are you?") or a direct response to a conversational pleasantry, respond with exactly: "CHITCHAT".

If the user asks ANY question (e.g. "who is...", "what is..."), requests any information, or asks to summarize a document, it ALWAYS REQUIRES knowledge. In this case, rewrite the latest user message into a standalone search query that contains all necessary context from the conversation history to be used in a vector search.

Conversation History:
{[m.content for m in messages[:-1]]}

Latest User Message: {latest_msg}

Output ONLY "CHITCHAT" or the standalone query string. Do not output anything else.
CRITICAL INSTRUCTION: Do NOT use or call any tools or functions. Output your response directly as plain text.
"""
    response = generator_llm.invoke([SystemMessage(content=prompt)])
    output = response.content.strip()
    
    # Strip any potential quotes from the LLM output
    if output.startswith('"') and output.endswith('"'):
        output = output[1:-1]
    if output.startswith("'") and output.endswith("'"):
        output = output[1:-1]
        
    trace_steps = state.get("trace_steps", [])
    
    if output == "CHITCHAT":
        trace_steps.append({"node": "route", "status": "Routed to chit-chat"})
        return {"queries": ["CHITCHAT"], "trace_steps": trace_steps}
    else:
        trace_steps.append({"node": "route", "status": f"Rewrote query: {output}"})
        return {"queries": [latest_msg, output], "trace_steps": trace_steps}

def retrieve_node(state: AgentState) -> AgentState:
    """
    Retrieves documents based on the rewritten query.
    """
    queries = state["queries"]
    collection_id = state["collection_id"]
    
    docs = hybrid_search(queries, collection_id, k=10)
    
    trace_steps = state.get("trace_steps", [])
    trace_steps.append({"node": "retrieve", "status": f"Retrieved and re-ranked top {len(docs)} chunks"})
    
    return {"documents": docs, "trace_steps": trace_steps}

def grade_documents_node(state: AgentState) -> AgentState:
    """
    Evaluates if the combined retrieved chunks contain enough information to answer the user's question.
    It does not filter chunks, only decides if web fallback is needed.
    """
    queries = state["queries"]
    documents = state["documents"]
    main_query = queries[0] if queries else ""
    
    if not documents:
        return {"documents": [], "relevance_score": 0.0, "web_fallback_needed": True}
        
    combined_context = "\n".join([doc['content'] for doc in documents])
    
    prompt = f"""You are a grader assessing whether a set of retrieved documents contains enough information to answer the user question.
Here are the retrieved documents:
{combined_context}

Here is the user question: {main_query}

If the documents contain any information that is useful to answer or partially answer the question, grade it as relevant.
Give a binary score 'yes' or 'no' to indicate whether we have enough context (yes) or need to search the web (no).
Output ONLY 'yes' or 'no'. CRITICAL INSTRUCTION: Do NOT use or call any tools or functions. Output your response directly as plain text."""
    
    response = generator_llm.invoke([SystemMessage(content=prompt)])
    grade = response.content.strip().lower()
    
    web_fallback = "no" in grade
    relevance_score = 1.0 if not web_fallback else 0.0
    
    trace_steps = state.get("trace_steps", [])
    status = "Context sufficient" if not web_fallback else "Context insufficient, web fallback triggered"
    trace_steps.append({
        "node": "grade_documents", 
        "status": status
    })
    
    return {
        "documents": documents, # Pass all documents forward
        "relevance_score": relevance_score,
        "web_fallback_needed": web_fallback,
        "trace_steps": trace_steps
    }

def web_search_node(state: AgentState) -> AgentState:
    """
    Falls back to Tavily web search if retrieval fails.
    """
    queries = state["queries"]
    query = queries[0] if queries else ""
    trace_steps = state.get("trace_steps", [])
    
    try:
        url = "https://api.tavily.com/search"
        data = {
            "api_key": settings.TAVILY_API_KEY,
            "query": query,
            "search_depth": "basic",
            "include_answer": False,
            "max_results": 3
        }
        
        req = urllib.request.Request(url, json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            
        web_docs = []
        for i, res in enumerate(result.get("results", [])):
            web_docs.append({
                "id": f"web_{i}",
                "content": res["content"],
                "document_name": "Web Search (Tavily)",
                "page_number": None,
                "url": res["url"]
            })
            
        trace_steps.append({"node": "web_search", "status": f"Fetched {len(web_docs)} results from web"})
        return {"documents": state.get("documents", []) + web_docs, "trace_steps": trace_steps}
        
    except Exception as e:
        print(f"Tavily search failed: {e}")
        trace_steps.append({"node": "web_search", "status": "Web search failed"})
        return {"trace_steps": trace_steps}

def generate_node(state: AgentState) -> AgentState:
    """
    Generates the final answer using the retrieved/web context.
    """
    if state.get("queries") and "CHITCHAT" in state["queries"]:
        # Direct generation for simple chat
        chat_prompt = SystemMessage(content="You are a helpful AI assistant. Answer the user conversationally. CRITICAL INSTRUCTION: Do NOT use or call any tools or functions. Output your response directly as plain text.")
        response = generator_llm.invoke([chat_prompt] + list(state["messages"]))
        trace_steps = state.get("trace_steps", [])
        trace_steps.append({"node": "generate", "status": "Generated conversational response"})
        return {"generation": response.content, "trace_steps": trace_steps}
        
    queries = state["queries"]
    query = queries[0] if queries else ""
    documents = state["documents"]
    
    context_str = ""
    for i, doc in enumerate(documents):
        doc_name = doc.get('document_name', 'Unknown Document')
        context_str += f"\n[Document {i+1}: {doc_name}]\n{doc['content']}\n"
        
    prompt = f"""You are an expert AI assistant. Answer the user's query based ONLY on the provided context below.
If you don't know the answer based on the context, say so. Do not hallucinate.

When you use information from a document, you MUST include an inline citation in brackets referencing the document number, e.g., [1] or [2].

Context:
{context_str}

User Query: {query}

Answer:
CRITICAL INSTRUCTION: Do NOT use or call any tools or functions. Output your response directly as plain text."""

    response = generator_llm.invoke([SystemMessage(content=prompt)])
    
    trace_steps = state.get("trace_steps", [])
    trace_steps.append({"node": "generate", "status": "Generated answer from context"})
    
    return {"generation": response.content, "trace_steps": trace_steps}

def check_hallucination_node(state: AgentState) -> AgentState:
    """
    Checks if the generated answer is grounded in the provided documents.
    """
    if state.get("queries") and "CHITCHAT" in state["queries"]:
        return {"is_grounded": True}
        
    documents = state["documents"]
    generation = state["generation"]
    
    context_str = "\n\n".join([doc['content'] for doc in documents])
    
    prompt = f"""You are a grader assessing whether an LLM generation is grounded in / supported by a set of retrieved facts.
Here are the retrieved facts:
{context_str}

Here is the LLM generation:
{generation}

Determine if the answer is completely grounded in and supported by the facts.
Give a binary score 'yes' or 'no'. 'yes' means that the answer is completely grounded in / supported by the facts. 'no' means it contains hallucinations or unverified claims.
Output ONLY 'yes' or 'no'. CRITICAL INSTRUCTION: Do NOT use or call any tools or functions. Output your response directly as plain text."""

    response = generator_llm.invoke([SystemMessage(content=prompt)])
    grade = response.content.strip().lower()
    
    is_grounded = "yes" in grade
    
    trace_steps = state.get("trace_steps", [])
    status = "Grounded ✓" if is_grounded else "Hallucination Detected ✗"
    trace_steps.append({"node": "check_hallucination", "status": status})
    
    return {
        "is_grounded": is_grounded, 
        "trace_steps": trace_steps,
        "iterations": state.get("iterations", 0) + 1
    }

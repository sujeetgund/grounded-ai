import json
import urllib.request
from typing import Dict, Any, List
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_groq import ChatGroq
from config import settings
from .state import AgentState
from .retriever import hybrid_search

# Initialize models
grader_llm = ChatGroq(model="llama-3.1-8b-instant", api_key=settings.GROQ_API_KEY)
# We use the user-requested model string for generation
generator_llm = ChatGroq(model="openai/gpt-oss-120b", api_key=settings.GROQ_API_KEY)

def route_and_rewrite_node(state: AgentState) -> AgentState:
    """
    Decides if the message requires RAG or is just chit-chat.
    If it requires RAG, rewrites the latest query into a standalone query.
    """
    messages = state["messages"]
    if not messages:
        return {"query": ""}
        
    latest_msg = messages[-1].content
    
    # Simple heuristic or LLM call to route
    prompt = f"""You are a query router and rewriter for a Retrieval-Augmented Generation (RAG) system.
Look at the following conversation history and the latest user message.
If the latest message is a simple greeting or conversational chit-chat that doesn't require searching for knowledge, respond with exactly: "CHITCHAT".
Otherwise, rewrite the latest user message into a standalone search query that contains all necessary context from the conversation history to be used in a vector search.

Conversation History:
{[m.content for m in messages[:-1]]}

Latest User Message: {latest_msg}

Output ONLY "CHITCHAT" or the standalone query string. Do not output anything else.
"""
    response = grader_llm.invoke([SystemMessage(content=prompt)])
    output = response.content.strip()
    
    trace_steps = state.get("trace_steps", [])
    
    if output == "CHITCHAT":
        trace_steps.append({"node": "route", "status": "Routed to chit-chat"})
        return {"query": "CHITCHAT", "trace_steps": trace_steps}
    else:
        trace_steps.append({"node": "route", "status": f"Rewrote query: {output}"})
        return {"query": output, "trace_steps": trace_steps}


def retrieve_node(state: AgentState) -> AgentState:
    """
    Retrieves documents based on the rewritten query.
    """
    query = state["query"]
    collection_id = state["collection_id"]
    
    docs = hybrid_search(query, collection_id, k=5)
    
    trace_steps = state.get("trace_steps", [])
    trace_steps.append({"node": "retrieve", "status": f"Retrieved {len(docs)} chunks via Hybrid Search (RRF)"})
    
    return {"documents": docs, "trace_steps": trace_steps}


def grade_documents_node(state: AgentState) -> AgentState:
    """
    Evaluates each retrieved chunk for relevance to the query.
    """
    query = state["query"]
    documents = state["documents"]
    
    if not documents:
        return {"documents": [], "relevance_score": 0.0, "web_fallback_needed": True}
        
    relevant_docs = []
    
    for doc in documents:
        prompt = f"""You are a grader assessing relevance of a retrieved document to a user question.
Here is the retrieved document:
{doc['content']}

Here is the user question: {query}

If the document contains keyword(s) or semantic meaning related to the user question, grade it as relevant.
Give a binary score 'yes' or 'no' to indicate whether the document is relevant to the question.
Output ONLY 'yes' or 'no'."""
        
        response = grader_llm.invoke([SystemMessage(content=prompt)])
        grade = response.content.strip().lower()
        
        if "yes" in grade:
            relevant_docs.append(doc)
            
    relevance_score = len(relevant_docs) / len(documents) if documents else 0.0
    web_fallback = len(relevant_docs) == 0
    
    trace_steps = state.get("trace_steps", [])
    trace_steps.append({
        "node": "grade_documents", 
        "status": f"Graded chunks: {len(relevant_docs)}/{len(documents)} relevant"
    })
    
    return {
        "documents": relevant_docs,
        "relevance_score": relevance_score,
        "web_fallback_needed": web_fallback,
        "trace_steps": trace_steps
    }


def web_search_node(state: AgentState) -> AgentState:
    """
    Falls back to Tavily web search if retrieval fails.
    """
    query = state["query"]
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
        return {"documents": state.get("documents", []) + web_docs, "trace_steps": trace_steps, "web_fallback_needed": False}
        
    except Exception as e:
        print(f"Tavily search failed: {e}")
        trace_steps.append({"node": "web_search", "status": "Web search failed"})
        return {"trace_steps": trace_steps}


def generate_node(state: AgentState) -> AgentState:
    """
    Generates the final answer using the retrieved/web context.
    """
    if state.get("query") == "CHITCHAT":
        # Direct generation for simple chat
        response = generator_llm.invoke(state["messages"])
        trace_steps = state.get("trace_steps", [])
        trace_steps.append({"node": "generate", "status": "Generated conversational response"})
        return {"generation": response.content, "trace_steps": trace_steps}
        
    query = state["query"]
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

Answer:"""

    response = generator_llm.invoke([SystemMessage(content=prompt)])
    
    trace_steps = state.get("trace_steps", [])
    trace_steps.append({"node": "generate", "status": "Generated answer from context"})
    
    return {"generation": response.content, "trace_steps": trace_steps}


def check_hallucination_node(state: AgentState) -> AgentState:
    """
    Checks if the generated answer is grounded in the provided documents.
    """
    if state.get("query") == "CHITCHAT":
        return {"is_grounded": True}
        
    documents = state["documents"]
    generation = state["generation"]
    
    context_str = "\n\n".join([doc['content'] for doc in documents])
    
    prompt = f"""You are a grader assessing whether an LLM generation is grounded in / supported by a set of retrieved facts.
Here are the retrieved facts:
{context_str}

Here is the LLM generation:
{generation}

Give a binary score 'yes' or 'no'. 'yes' means that the answer is completely grounded in / supported by the facts. 'no' means it contains hallucinations or unverified claims.
Output ONLY 'yes' or 'no'."""

    response = grader_llm.invoke([SystemMessage(content=prompt)])
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

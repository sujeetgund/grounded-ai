from typing import Annotated, Sequence, TypedDict, List, Dict, Any
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    """
    Represents the state of our agentic RAG loop.
    """
    # The chat history and current user input
    messages: Annotated[Sequence[BaseMessage], add_messages]
    
    # Search query
    queries: List[str]
    
    # ID of the collection to search in
    collection_id: str
    
    # Retrieved document chunks
    documents: List[Dict[str, Any]]
    
    # Final generated answer
    generation: str
    
    # Evaluation scores
    is_grounded: bool
    relevance_score: float
    
    # Routing flags
    web_fallback_needed: bool
    
    # To prevent infinite loops
    iterations: int
    
    # Agent trace steps for the UI
    trace_steps: List[Dict[str, Any]]

from typing import Literal
from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes import (
    route_and_rewrite_node,
    retrieve_node,
    grade_documents_node,
    web_search_node,
    generate_node,
    check_hallucination_node
)

def build_graph() -> StateGraph:
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("route_and_rewrite", route_and_rewrite_node)
    workflow.add_node("retrieve", retrieve_node)
    workflow.add_node("grade_documents", grade_documents_node)
    workflow.add_node("web_search", web_search_node)
    workflow.add_node("generate", generate_node)
    workflow.add_node("check_hallucination", check_hallucination_node)
    
    # Define edges
    
    def route_after_rewrite(state: AgentState) -> Literal["generate", "retrieve"]:
        if state.get("query") == "CHITCHAT":
            return "generate"
        return "retrieve"
        
    workflow.set_entry_point("route_and_rewrite")
    workflow.add_conditional_edges(
        "route_and_rewrite",
        route_after_rewrite,
        {
            "generate": "generate",
            "retrieve": "retrieve"
        }
    )
    
    workflow.add_edge("retrieve", "grade_documents")
    
    def route_after_grade(state: AgentState) -> Literal["web_search", "generate"]:
        if state.get("web_fallback_needed"):
            return "web_search"
        return "generate"
        
    workflow.add_conditional_edges(
        "grade_documents",
        route_after_grade,
        {
            "web_search": "web_search",
            "generate": "generate"
        }
    )
    
    workflow.add_edge("web_search", "generate")
    workflow.add_edge("generate", "check_hallucination")
    
    def route_after_hallucination(state: AgentState) -> Literal["END", "web_search"]:
        if state.get("query") == "CHITCHAT" or state.get("is_grounded"):
            return "END"
            
        iterations = state.get("iterations", 0)
        
        if iterations >= 2:
            return "END"
            
        return "web_search"
        
    workflow.add_conditional_edges(
        "check_hallucination",
        route_after_hallucination,
        {
            "END": END,
            "web_search": "web_search"
        }
    )
    
    return workflow.compile()

# Export a compiled instance
agent_app = build_graph()

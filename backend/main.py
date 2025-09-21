from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import os
from dotenv import load_dotenv
import asyncio

from services.project_analyzer import ProjectAnalyzer
from services.github_service import GitHubService
from services.perplexity_service import PerplexityService
from services.vector_store import VectorStore
from services.flow_diagram_service import FlowDiagramService
from models.schemas import (
    GitHubAnalysisRequest,
    QueryRequest,
    RouteInfoRequest,
    AnalysisResponse
)

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Project Analyzer API",
    description="AI-powered project analysis and understanding",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
project_analyzer = ProjectAnalyzer()
github_service = GitHubService()
perplexity_service = PerplexityService()
vector_store = VectorStore()
flow_diagram_service = FlowDiagramService()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    # Initialize vector store asynchronously to avoid blocking server startup
    asyncio.create_task(vector_store.initialize())

@app.get("/")
async def root():
    return {"message": "Project Analyzer API is running"}

@app.post("/api/analyze-files", response_model=AnalysisResponse)
async def analyze_files(files: List[UploadFile] = File(...)):
    """Analyze uploaded project files"""
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # Process uploaded files
        file_contents = []
        for file in files:
            content = await file.read()
            file_contents.append({
                'name': file.filename,
                'content': content.decode('utf-8', errors='ignore'),
                'type': file.content_type
            })
        
        # Analyze the project
        analysis_result = await project_analyzer.analyze_files(file_contents)
        
        # Store in vector database for future queries
        await vector_store.store_project_data(analysis_result)
        
        return AnalysisResponse(**analysis_result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/analyze-github", response_model=AnalysisResponse)
async def analyze_github(request: GitHubAnalysisRequest):
    """Analyze GitHub repository"""
    try:
        # Clone and analyze GitHub repository
        repo_data = await github_service.clone_and_analyze(request.github_url)
        
        # Analyze the project
        analysis_result = await project_analyzer.analyze_repository(repo_data)
        
        # Store in vector database for future queries
        await vector_store.store_project_data(analysis_result)
        
        return AnalysisResponse(**analysis_result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub analysis failed: {str(e)}")

@app.post("/api/get-route-info")
async def get_route_info(request: RouteInfoRequest):
    """Get specific information about a project route/aspect"""
    try:
        # Use Perplexity API to get route-specific information
        route_info = await perplexity_service.get_route_information(
            request.route, 
            request.project_context
        )
        
        return {"content": route_info}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get route info: {str(e)}")

@app.post("/api/query")
async def query_project(request: QueryRequest):
    """Query the project with natural language"""
    try:
        # Search relevant context from vector store
        relevant_context = await vector_store.search_similar(request.query)
        
        # Get AI response using Perplexity
        response = await perplexity_service.query_project(
            request.query,
            request.context,
            request.route,
            relevant_context
        )
        
        return {"response": response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

@app.post("/api/flow-diagram")
async def flow_diagram(request: RouteInfoRequest):
    """Generate a project flow diagram (Mermaid) based on project context"""
    try:
        diagram = await flow_diagram_service.generate_diagram(request.project_context)
        return diagram
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate flow diagram: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "vector_store": await vector_store.health_check(),
            "perplexity": perplexity_service.health_check(),
            "github": github_service.health_check()
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "False").lower() == "true"
    )

from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any

class GitHubAnalysisRequest(BaseModel):
    github_url: str

class QueryRequest(BaseModel):
    query: str
    context: Dict[str, Any]
    route: str

class RouteInfoRequest(BaseModel):
    route: str
    project_context: Dict[str, Any]

class FileInfo(BaseModel):
    name: str
    content: str
    type: Optional[str] = None
    size: Optional[int] = None
    language: Optional[str] = None

class TechnologyInfo(BaseModel):
    name: str
    version: Optional[str] = None
    category: str  # frontend, backend, database, etc.
    confidence: float

class AnalysisResponse(BaseModel):
    summary: str
    technologies: List[str]
    structure: str
    context: Dict[str, Any]
    files_analyzed: int
    main_language: Optional[str] = None
    framework: Optional[str] = None
    architecture_type: Optional[str] = None
    complexity_score: Optional[float] = None
    
class ProjectFlowNode(BaseModel):
    id: str
    label: str
    type: str  # component, service, database, etc.
    position: Dict[str, float]
    
class ProjectFlowEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    
class ProjectFlowDiagram(BaseModel):
    nodes: List[ProjectFlowNode]
    edges: List[ProjectFlowEdge]
    
class HealthCheckResponse(BaseModel):
    status: str
    services: Dict[str, bool]

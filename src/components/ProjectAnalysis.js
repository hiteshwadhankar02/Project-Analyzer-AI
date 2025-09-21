import React, { useState } from 'react';
import { 
  Code, 
  Database, 
  Globe, 
  Server, 
  Search, 
  ArrowLeft, 
  MessageCircle,
  GitBranch,
  FileCode,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MermaidViewer from './MermaidViewer';

const ProjectAnalysis = ({ projectData, analysisResult }) => {
  const [selectedRoute, setSelectedRoute] = useState('overview');
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowError, setFlowError] = useState('');
  const [flowData, setFlowData] = useState(null); // { mermaid, nodes, edges }
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();

  if (!analysisResult) {
    navigate('/');
    return null;
  }

  const routes = [
    { id: 'overview', label: 'Overview', icon: FileCode },
    { id: 'frontend', label: 'Frontend', icon: Globe },
    { id: 'backend', label: 'Backend', icon: Server },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'flow', label: 'Project Flow', icon: GitBranch },
  ];

  const handleRouteSelect = async (routeId) => {
    setSelectedRoute(routeId);
    setFlowError('');
    
    // If we have detailed analysis, just switch routes without making API calls
    if (analysisResult.detailed_analysis && routeId !== 'flow') {
      return;
    }
    
    try {
      if (routeId === 'flow') {
        setFlowLoading(true);
        const response = await axios.post('http://localhost:8000/api/flow-diagram', {
          route: routeId,
          project_context: analysisResult
        });
        setFlowData(response.data);
      } else {
        // Skip fetching route info since we have detailed analysis
      }
    } catch (error) {
      console.error('Failed to get route information:', error);
      if (routeId === 'flow') {
        setFlowError('Failed to generate project flow diagram.');
      }
    }
    finally {
      if (routeId === 'flow') setFlowLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    setIsQuerying(true);
    const userQuery = query;
    setQuery('');

    // Add user query to chat history
    setChatHistory(prev => [...prev, {
      type: 'user',
      content: userQuery
    }]);

    try {
      const response = await axios.post('http://localhost:8000/api/query', {
        query: userQuery,
        context: analysisResult,
        route: selectedRoute
      });

      // Add AI response to chat history
      setChatHistory(prev => [...prev, {
        type: 'ai',
        content: response.data.response
      }]);
    } catch (error) {
      setChatHistory(prev => [...prev, {
        type: 'error',
        content: 'Failed to get response. Please try again.'
      }]);
    } finally {
      setIsQuerying(false);
    }
  };

  const renderDetailedAnalysis = (analysis) => {
    switch (selectedRoute) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Project Overview</h3>
              <p className="text-white/80 mb-4">{analysisResult.summary}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Project Type</h4>
                  <p className="text-white/70">{analysis.project_type}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Complexity</h4>
                  <p className="text-white/70">{analysis.complexity_indicators?.complexity_level} ({analysis.complexity_indicators?.total_lines} lines)</p>
                </div>
              </div>
            </div>

            {analysis.key_files?.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Key Files</h4>
                <div className="space-y-2">
                  {analysis.key_files.map((file, index) => (
                    <div key={index} className="bg-white/5 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">{file.name}</span>
                        <span className="text-white/60 text-sm">{file.lines} lines</span>
                      </div>
                      <p className="text-white/70 text-sm mt-1">{file.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.entry_points?.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Entry Points</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.entry_points.map((entry, index) => (
                    <span key={index} className="px-3 py-1 bg-primary-600 text-white rounded-full text-sm">
                      {entry}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'frontend':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Frontend Analysis</h3>
              
              {analysis.frameworks_used?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-white mb-2">Frameworks Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.frameworks_used.map((framework, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
                        {framework}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.components?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Components ({analysis.components.length})</h4>
                  <div className="space-y-4">
                    {analysis.components.slice(0, 3).map((component, index) => (
                      <div key={index} className="bg-white/5 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-white font-medium">{component.name}</span>
                          <span className="text-white/60 text-sm">{component.type}</span>
                        </div>
                        
                        {/* Code Preview */}
                        {getFileContent(component.name) && (
                          <div className="mb-3">
                            <h5 className="text-white/80 text-sm mb-2">Code Preview:</h5>
                            <pre className="bg-black/40 p-3 rounded text-xs text-white/70 overflow-x-auto max-h-32">
                              {getFileContent(component.name).split('\n').slice(0, 10).join('\n')}
                              {getFileContent(component.name).split('\n').length > 10 && '\n...'}
                            </pre>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {component.exports?.length > 0 && (
                            <div>
                              <span className="text-white/70">Exports: </span>
                              <span className="text-white/60">{component.exports.slice(0, 2).join(', ')}</span>
                            </div>
                          )}
                          {component.imports?.length > 0 && (
                            <div>
                              <span className="text-white/70">Key Imports: </span>
                              <span className="text-white/60">{component.imports.slice(0, 2).join(', ')}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Component Purpose */}
                        <div className="mt-3 p-2 bg-blue-500/10 rounded">
                          <p className="text-blue-200 text-sm">
                            💡 <strong>Purpose:</strong> {getComponentPurpose(component.name, component.exports)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Frontend Architecture */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Frontend Architecture</h4>
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-white font-medium mb-2">Structure Pattern</h5>
                      <p className="text-white/70 text-sm">
                        {analysis.components?.length > 0 ? 'Component-based architecture' : 'Static file structure'}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-white font-medium mb-2">Data Flow</h5>
                      <p className="text-white/70 text-sm">
                        {analysis.state_management?.length > 0 ? 'State management detected' : 'Props-based communication'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {analysis.routing_files?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-white mb-2">Routing</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.routing_files.map((file, index) => (
                      <span key={index} className="px-3 py-1 bg-green-600 text-white rounded-full text-sm">
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.state_management?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-2">State Management</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.state_management.map((file, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm">
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'backend':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Backend Analysis</h3>
              
              {analysis.frameworks_used?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-white mb-2">Backend Frameworks</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.frameworks_used.map((framework, index) => (
                      <span key={index} className="px-3 py-1 bg-orange-600 text-white rounded-full text-sm">
                        {framework}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.api_files?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">API Endpoints</h4>
                  <div className="space-y-4">
                    {analysis.api_files.slice(0, 2).map((apiFile, index) => (
                      <div key={index} className="bg-white/5 p-4 rounded-lg">
                        <h5 className="text-white font-medium mb-3">{apiFile.file}</h5>
                        
                        {/* Code Preview */}
                        {getFileContent(apiFile.file) && (
                          <div className="mb-4">
                            <h6 className="text-white/80 text-sm mb-2">Code Preview:</h6>
                            <pre className="bg-black/40 p-3 rounded text-xs text-white/70 overflow-x-auto max-h-32">
                              {getFileContent(apiFile.file).split('\n').slice(0, 12).join('\n')}
                              {getFileContent(apiFile.file).split('\n').length > 12 && '\n...'}
                            </pre>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          {apiFile.endpoints.slice(0, 4).map((endpoint, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 bg-white/5 rounded">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                endpoint.method === 'GET' ? 'bg-blue-600' :
                                endpoint.method === 'POST' ? 'bg-green-600' :
                                endpoint.method === 'PUT' ? 'bg-yellow-600' :
                                endpoint.method === 'DELETE' ? 'bg-red-600' : 'bg-gray-600'
                              } text-white`}>
                                {endpoint.method}
                              </span>
                              <span className="text-white/80 flex-1">{endpoint.path}</span>
                              <span className="text-white/60 text-xs">
                                {getEndpointPurpose(endpoint.method, endpoint.path)}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        {/* API Purpose */}
                        <div className="mt-3 p-2 bg-orange-500/10 rounded">
                          <p className="text-orange-200 text-sm">
                            🔧 <strong>Purpose:</strong> {getApiFilePurpose(apiFile.file, apiFile.endpoints)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Backend Architecture */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Backend Architecture</h4>
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-white font-medium mb-2">API Pattern</h5>
                      <p className="text-white/70 text-sm">
                        {analysis.api_files?.length > 0 ? 'RESTful API architecture' : 'Service-based structure'}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-white font-medium mb-2">Request Flow</h5>
                      <p className="text-white/70 text-sm">
                        {analysis.middleware?.length > 0 ? 'Middleware-based processing' : 'Direct request handling'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Request Flow Diagram */}
                  <div className="mt-4 p-3 bg-black/20 rounded">
                    <h6 className="text-white/80 text-sm mb-2">Request Flow:</h6>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span className="px-2 py-1 bg-blue-600/20 rounded">Client</span>
                      <span>→</span>
                      {analysis.middleware?.length > 0 && (
                        <>
                          <span className="px-2 py-1 bg-yellow-600/20 rounded">Middleware</span>
                          <span>→</span>
                        </>
                      )}
                      <span className="px-2 py-1 bg-green-600/20 rounded">Route Handler</span>
                      <span>→</span>
                      <span className="px-2 py-1 bg-purple-600/20 rounded">Response</span>
                    </div>
                  </div>
                </div>
              </div>

              {analysis.models?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Data Models</h4>
                  <div className="space-y-2">
                    {analysis.models.map((model, index) => (
                      <div key={index} className="bg-white/5 p-3 rounded">
                        <span className="text-white font-medium">{model.file}</span>
                        {model.models?.length > 0 && (
                          <div className="mt-1">
                            <span className="text-white/70 text-sm">Models: </span>
                            <span className="text-white/60 text-sm">{model.models.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'database':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Database Analysis</h3>
              
              {analysis.databases_detected?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-white mb-2">Databases Detected</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.databases_detected.map((db, index) => (
                      <span key={index} className="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm">
                        {db}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.schemas?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Database Schemas</h4>
                  <div className="space-y-4">
                    {analysis.schemas.map((schema, index) => (
                      <div key={index} className="bg-white/5 p-4 rounded-lg">
                        <h5 className="text-white font-medium mb-3">{schema.file}</h5>
                        
                        {/* Schema Code Preview */}
                        {getFileContent(schema.file) && (
                          <div className="mb-4">
                            <h6 className="text-white/80 text-sm mb-2">Schema Code:</h6>
                            <pre className="bg-black/40 p-3 rounded text-xs text-white/70 overflow-x-auto max-h-40">
                              {getFileContent(schema.file).split('\n').slice(0, 15).join('\n')}
                              {getFileContent(schema.file).split('\n').length > 15 && '\n...'}
                            </pre>
                          </div>
                        )}
                        
                        {schema.tables?.length > 0 && (
                          <div className="mb-3">
                            <span className="text-white/70 text-sm">Tables: </span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {schema.tables.map((table, idx) => (
                                <span key={idx} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">
                                  {table}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Schema Purpose */}
                        <div className="mt-3 p-2 bg-indigo-500/10 rounded">
                          <p className="text-indigo-200 text-sm">
                            🗄️ <strong>Purpose:</strong> {getSchemaPurpose(schema.file, schema.tables)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Database Architecture */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Database Architecture</h4>
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h5 className="text-white font-medium mb-2">Data Model</h5>
                      <p className="text-white/70 text-sm">
                        {analysis.schemas?.length > 0 ? 'Structured schema design' : 'Dynamic data structure'}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-white font-medium mb-2">Storage Type</h5>
                      <p className="text-white/70 text-sm">
                        {analysis.databases_detected?.includes('MongoDB') ? 'Document-based' : 
                         analysis.databases_detected?.some(db => ['PostgreSQL', 'MySQL', 'SQLite'].includes(db)) ? 'Relational' : 'File-based'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Data Flow Diagram */}
                  <div className="p-3 bg-black/20 rounded">
                    <h6 className="text-white/80 text-sm mb-2">Data Flow:</h6>
                    <div className="flex items-center gap-2 text-xs text-white/60 flex-wrap">
                      <span className="px-2 py-1 bg-blue-600/20 rounded">Application</span>
                      <span>→</span>
                      <span className="px-2 py-1 bg-green-600/20 rounded">ORM/Query Layer</span>
                      <span>→</span>
                      <span className="px-2 py-1 bg-indigo-600/20 rounded">Database</span>
                      <span>→</span>
                      <span className="px-2 py-1 bg-purple-600/20 rounded">Storage</span>
                    </div>
                  </div>
                </div>
              </div>

              {analysis.migrations?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-2">Migration Files</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.migrations.map((migration, index) => (
                      <span key={index} className="px-3 py-1 bg-teal-600 text-white rounded-full text-sm">
                        {migration}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'architecture':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Architecture Analysis</h3>
              
              {analysis.patterns?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-white mb-2">Architectural Patterns</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.patterns.map((pattern, index) => (
                      <span key={index} className="px-3 py-1 bg-pink-600 text-white rounded-full text-sm">
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.layers?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-white mb-2">Application Layers</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.layers.map((layer, index) => (
                      <span key={index} className="px-3 py-1 bg-cyan-600 text-white rounded-full text-sm">
                        {layer}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Architecture Visualization */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">System Architecture</h4>
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    {analysis.layers?.map((layer, index) => (
                      <div key={index} className="p-3 bg-cyan-600/20 rounded text-center">
                        <h5 className="text-cyan-200 font-medium text-sm">{layer}</h5>
                      </div>
                    ))}
                  </div>
                  
                  {/* Architecture Flow */}
                  <div className="p-3 bg-black/20 rounded mb-4">
                    <h6 className="text-white/80 text-sm mb-2">Architecture Flow:</h6>
                    <div className="flex items-center gap-2 text-xs text-white/60 flex-wrap justify-center">
                      <span className="px-2 py-1 bg-blue-600/20 rounded">Presentation</span>
                      <span>↓</span>
                      <span className="px-2 py-1 bg-green-600/20 rounded">Business Logic</span>
                      <span>↓</span>
                      <span className="px-2 py-1 bg-purple-600/20 rounded">Data Access</span>
                      <span>↓</span>
                      <span className="px-2 py-1 bg-indigo-600/20 rounded">Database</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code Organization */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Code Organization</h4>
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-white font-medium mb-2">File Structure</h5>
                      <div className="text-sm text-white/70">
                        {getArchitectureStructure(analysisResult.context?.files)}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-white font-medium mb-2">Design Patterns</h5>
                      <div className="space-y-1">
                        {analysis.patterns?.map((pattern, index) => (
                          <span key={index} className="inline-block px-2 py-1 bg-pink-600/20 text-pink-200 rounded text-sm mr-2">
                            {pattern}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Separation of Concerns</h4>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-4 h-4 rounded-full ${analysis.separation_of_concerns ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-white/80">
                    {analysis.separation_of_concerns ? 'Well Organized' : 'Needs Improvement'}
                  </span>
                </div>
                <p className="text-white/70 text-sm">
                  {analysis.separation_of_concerns 
                    ? 'Good separation of concerns detected with multiple application layers. The code is well-organized with clear boundaries between different responsibilities.'
                    : 'Limited separation of concerns detected. Consider organizing code into distinct layers (presentation, business logic, data access) for better maintainability.'
                  }
                </p>
                
                {/* Recommendations */}
                <div className="mt-4 p-3 bg-yellow-500/10 rounded">
                  <h5 className="text-yellow-200 font-medium text-sm mb-2">💡 Recommendations:</h5>
                  <ul className="text-yellow-200/80 text-sm space-y-1">
                    {!analysis.separation_of_concerns && (
                      <li>• Separate business logic from presentation components</li>
                    )}
                    {analysis.patterns?.length === 0 && (
                      <li>• Consider implementing design patterns like MVC or Repository</li>
                    )}
                    <li>• Use dependency injection for better testability</li>
                    <li>• Implement proper error handling and logging</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <Code className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">
              Detailed analysis for {selectedRoute} is being processed...
            </p>
          </div>
        );
    }
  };

  const renderContent = () => {
    if (selectedRoute === 'flow') {
      return (
        <div className="space-y-4">
          {flowLoading && (
            <div className="text-white/70">Generating flow diagram...</div>
          )}
          {flowError && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded text-red-200">{flowError}</div>
          )}
          {flowData?.mermaid && (
            <MermaidViewer chart={flowData.mermaid} />
          )}
          {!flowLoading && !flowError && !flowData?.mermaid && (
            <div className="text-white/60">Click "Project Flow" to generate the diagram.</div>
          )}
        </div>
      );
    }

    // Use detailed analysis from backend
    const detailedAnalysis = analysisResult.detailed_analysis;
    
    if (detailedAnalysis && detailedAnalysis[selectedRoute]) {
      try {
        return renderDetailedAnalysis(detailedAnalysis[selectedRoute]);
      } catch (error) {
        console.error('Error rendering detailed analysis:', error);
        // Fall through to fallback content
      }
    }

    // If no detailed analysis, try to get it from the backend
    const routeContent = chatHistory
      .filter(item => item.type === 'route' && item.route === selectedRoute)
      .pop();

    if (routeContent) {
      return (
        <div className="prose prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: routeContent.content }} />
        </div>
      );
    }

    // Enhanced fallback content when detailed analysis isn't available
    return renderFallbackContent();
  };

  const renderFallbackContent = () => {
    switch (selectedRoute) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Project Summary</h3>
              <p className="text-white/80">{analysisResult.summary}</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Technologies Used</h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.technologies?.map((tech, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-primary-600 text-white rounded-full text-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Project Structure</h3>
              <pre className="bg-black/30 p-4 rounded-lg text-white/80 overflow-x-auto text-sm">
                {analysisResult.structure}
              </pre>
            </div>
          </div>
        );
      
      case 'frontend':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Frontend Analysis</h3>
              <p className="text-white/80 mb-4">Analyzing frontend components and structure...</p>
              
              <div className="bg-white/5 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-white mb-2">Frontend Files Detected</h4>
                <div className="space-y-2">
                  {analysisResult.context?.files?.filter(file => 
                    file.name?.match(/\.(jsx?|tsx?|vue|html|css|scss)$/i)
                  ).slice(0, 5).map((file, index) => (
                    <div key={index} className="text-white/70 text-sm">
                      📄 {file.name} ({file.content?.split('\n').length || 0} lines)
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Technologies</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.technologies?.filter(tech => 
                    ['React', 'Vue', 'Angular', 'HTML', 'CSS', 'JavaScript', 'TypeScript'].includes(tech)
                  ).map((tech, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'backend':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Backend Analysis</h3>
              <p className="text-white/80 mb-4">Analyzing backend services and APIs...</p>
              
              <div className="bg-white/5 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-white mb-2">Backend Files Detected</h4>
                <div className="space-y-2">
                  {analysisResult.context?.files?.filter(file => 
                    file.name?.match(/\.(py|java|php|rb|go|cs|js)$/i) && 
                    !file.name?.match(/\.(jsx|tsx)$/i)
                  ).slice(0, 5).map((file, index) => (
                    <div key={index} className="text-white/70 text-sm">
                      🔧 {file.name} ({file.content?.split('\n').length || 0} lines)
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Backend Technologies</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.technologies?.filter(tech => 
                    ['Python', 'Django', 'Flask', 'FastAPI', 'Express', 'Node.js', 'Java', 'Spring'].includes(tech)
                  ).map((tech, index) => (
                    <span key={index} className="px-3 py-1 bg-orange-600 text-white rounded-full text-sm">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <Code className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">
              Click on a route above to get specific information about that aspect of the project.
            </p>
          </div>
        );
    }
  };

  // Helper functions for code analysis
  const getFileContent = (filename) => {
    const file = analysisResult.context?.files?.find(f => f.name === filename);
    return file?.content || '';
  };

  const getComponentPurpose = (filename, exports) => {
    const name = filename.toLowerCase();
    if (name.includes('app')) return 'Main application component that orchestrates the entire app';
    if (name.includes('header')) return 'Navigation and branding component';
    if (name.includes('footer')) return 'Footer content and links component';
    if (name.includes('sidebar')) return 'Side navigation or menu component';
    if (name.includes('modal')) return 'Popup dialog or overlay component';
    if (name.includes('form')) return 'User input and form handling component';
    if (name.includes('button')) return 'Interactive button component';
    if (name.includes('card')) return 'Content display card component';
    if (name.includes('list')) return 'Data listing and display component';
    if (exports?.some(e => e.toLowerCase().includes('provider'))) return 'Context or state provider component';
    return 'Reusable UI component for specific functionality';
  };

  const getApiFilePurpose = (filename, endpoints) => {
    const name = filename.toLowerCase();
    if (name.includes('auth')) return 'Handles user authentication and authorization';
    if (name.includes('user')) return 'Manages user data and profile operations';
    if (name.includes('admin')) return 'Administrative functions and management';
    if (name.includes('api') || name.includes('route')) return 'Main API routing and endpoint definitions';
    if (name.includes('controller')) return 'Business logic and request processing';
    if (name.includes('service')) return 'Service layer for business operations';
    if (endpoints?.some(e => e.method === 'POST')) return 'Handles data creation and updates';
    if (endpoints?.some(e => e.method === 'GET')) return 'Provides data retrieval and queries';
    return 'Server-side logic and API endpoints';
  };

  const getEndpointPurpose = (method, path) => {
    const pathLower = path.toLowerCase();
    if (method === 'GET' && pathLower.includes('list')) return 'List items';
    if (method === 'GET' && pathLower.includes('search')) return 'Search data';
    if (method === 'GET') return 'Fetch data';
    if (method === 'POST' && pathLower.includes('login')) return 'User login';
    if (method === 'POST' && pathLower.includes('register')) return 'User signup';
    if (method === 'POST') return 'Create new';
    if (method === 'PUT') return 'Update existing';
    if (method === 'DELETE') return 'Remove item';
    return 'Process request';
  };

  const getSchemaPurpose = (filename, tables) => {
    const name = filename.toLowerCase();
    if (name.includes('user')) return 'Manages user accounts and authentication data';
    if (name.includes('product')) return 'Stores product catalog and inventory information';
    if (name.includes('order')) return 'Handles order processing and transaction records';
    if (name.includes('migration')) return 'Database schema version control and updates';
    if (name.includes('seed')) return 'Initial data population for development/testing';
    if (tables?.some(t => t.toLowerCase().includes('user'))) return 'User management and profile data storage';
    if (tables?.length > 5) return 'Complex data relationships and business logic storage';
    return 'Application data storage and management';
  };

  const getArchitectureStructure = (files) => {
    if (!files || files.length === 0) return 'No files analyzed';
    
    const structure = [];
    const hasComponents = files.some(f => f.name?.includes('component'));
    const hasServices = files.some(f => f.name?.includes('service'));
    const hasControllers = files.some(f => f.name?.includes('controller'));
    const hasModels = files.some(f => f.name?.includes('model'));
    
    if (hasComponents) structure.push('📱 Component-based UI');
    if (hasServices) structure.push('⚙️ Service layer architecture');
    if (hasControllers) structure.push('🎮 Controller-based routing');
    if (hasModels) structure.push('📊 Data model definitions');
    
    const directories = [...new Set(files.map(f => f.name?.split('/')[0]).filter(Boolean))];
    if (directories.length > 3) structure.push(`📁 ${directories.length} main directories`);
    
    return structure.length > 0 ? structure.join(', ') : 'Flat file structure';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Upload
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Route Navigation */}
        <div className="lg:col-span-1">
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Explore Project</h3>
            <div className="space-y-2">
              {routes.map((route) => {
                const Icon = route.icon;
                return (
                  <button
                    key={route.id}
                    onClick={() => handleRouteSelect(route.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                      selectedRoute === route.id
                        ? 'bg-primary-600 text-white'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {route.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="glass-effect rounded-2xl p-6 mb-6">
            <div className="flex items-center mb-6">
              <div className="flex items-center">
                {routes.find(r => r.id === selectedRoute)?.icon && 
                  React.createElement(routes.find(r => r.id === selectedRoute).icon, {
                    className: "w-6 h-6 mr-3 text-primary-400"
                  })
                }
                <h2 className="text-2xl font-bold text-white">
                  {routes.find(r => r.id === selectedRoute)?.label || 'Project Analysis'}
                </h2>
              </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
              {renderContent()}
            </div>

            {/* Chat History Toggle */}
            {chatHistory.length > 0 && (
              <div className="mt-8 border-t border-white/20 pt-6">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center text-white/80 hover:text-white transition-colors mb-4"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Conversation History ({chatHistory.length})
                  <span className="ml-2">{showHistory ? '▼' : '▶'}</span>
                </button>
                
                {showHistory && (
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {chatHistory.map((item, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        item.type === 'user' 
                          ? 'bg-primary-600/20 ml-8' 
                          : item.type === 'ai'
                          ? 'bg-white/10 mr-8'
                          : 'bg-red-500/20'
                      }`}>
                        <div className="text-white/90">
                          {item.type === 'user' && <strong>You: </strong>}
                          {item.type === 'ai' && <strong>AI: </strong>}
                          {item.type === 'error' && <strong>Error: </strong>}
                          {item.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Query Input */}
            <div className="mt-6 border-t border-white/20 pt-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                  placeholder="Ask anything about this project..."
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/50 border border-white/20 focus:border-white/50 focus:outline-none"
                />
                <button
                  onClick={handleQuery}
                  disabled={isQuerying || !query.trim()}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalysis;

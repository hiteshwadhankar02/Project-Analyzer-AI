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
    
    try {
      if (routeId === 'flow') {
        setFlowLoading(true);
        const response = await axios.post('http://localhost:8000/api/flow-diagram', {
          route: routeId,
          project_context: {
            ...analysisResult.context,
            technologies: analysisResult.technologies,
            main_language: analysisResult.main_language,
            framework: analysisResult.framework,
            architecture_type: analysisResult.architecture_type,
            files_analyzed: analysisResult.files_analyzed
          }
        });
        setFlowData(response.data);
      } else {
        const response = await axios.post('http://localhost:8000/api/get-route-info', {
          route: routeId,
          project_context: analysisResult.context
        });
        
        // Add route-specific information to chat history
        setChatHistory(prev => [...prev, {
          type: 'route',
          route: routeId,
          content: response.data.content
        }]);
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
        context: analysisResult.context,
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
                  <div className="space-y-3">
                    {analysis.components.slice(0, 5).map((component, index) => (
                      <div key={index} className="bg-white/5 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-white font-medium">{component.name}</span>
                          <span className="text-white/60 text-sm">{component.type}</span>
                        </div>
                        {component.exports?.length > 0 && (
                          <div className="mb-2">
                            <span className="text-white/70 text-sm">Exports: </span>
                            <span className="text-white/60 text-sm">{component.exports.join(', ')}</span>
                          </div>
                        )}
                        {component.imports?.length > 0 && (
                          <div>
                            <span className="text-white/70 text-sm">Key Imports: </span>
                            <span className="text-white/60 text-sm">{component.imports.slice(0, 3).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  <div className="space-y-3">
                    {analysis.api_files.map((apiFile, index) => (
                      <div key={index} className="bg-white/5 p-4 rounded-lg">
                        <h5 className="text-white font-medium mb-2">{apiFile.file}</h5>
                        <div className="space-y-1">
                          {apiFile.endpoints.map((endpoint, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                endpoint.method === 'GET' ? 'bg-blue-600' :
                                endpoint.method === 'POST' ? 'bg-green-600' :
                                endpoint.method === 'PUT' ? 'bg-yellow-600' :
                                endpoint.method === 'DELETE' ? 'bg-red-600' : 'bg-gray-600'
                              } text-white`}>
                                {endpoint.method}
                              </span>
                              <span className="text-white/80">{endpoint.path}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  <div className="space-y-3">
                    {analysis.schemas.map((schema, index) => (
                      <div key={index} className="bg-white/5 p-4 rounded-lg">
                        <h5 className="text-white font-medium mb-2">{schema.file}</h5>
                        {schema.tables?.length > 0 && (
                          <div>
                            <span className="text-white/70 text-sm">Tables: </span>
                            <span className="text-white/60 text-sm">{schema.tables.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Separation of Concerns</h4>
                <p className="text-white/70">
                  {analysis.separation_of_concerns 
                    ? 'Good separation of concerns detected with multiple application layers'
                    : 'Limited separation of concerns - consider organizing code into distinct layers'
                  }
                </p>
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
      return renderDetailedAnalysis(detailedAnalysis[selectedRoute]);
    }

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

    // Default content based on analysis result
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
              <pre className="bg-black/30 p-4 rounded-lg text-white/80 overflow-x-auto">
                {analysisResult.structure}
              </pre>
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

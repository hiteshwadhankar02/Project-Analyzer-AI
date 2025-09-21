import os
import httpx
from typing import Dict, Any, List, Optional
import json

class PerplexityService:
    def __init__(self):
        self.api_key = os.getenv('PERPLEXITY_API_KEY')
        self.base_url = "https://api.perplexity.ai/chat/completions"
        self.model = "llama-3.1-sonar-small-128k-online"  # Use the online model for better results
        
        if self.api_key:
            print(f"Perplexity API Key loaded successfully: {self.api_key[:5]}...")
        else:
            print("Warning: PERPLEXITY_API_KEY not found in environment variables")

    async def get_route_information(self, route: str, project_context: Dict[str, Any]) -> str:
        """Get detailed information about a specific project route/aspect"""
        
        if not self.api_key:
            return self._get_fallback_route_info(route, project_context)
        
        # Create context-aware prompt based on the route
        prompt = self._create_route_prompt(route, project_context)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are an expert software architect and code analyst. Provide detailed, technical explanations about software projects."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "max_tokens": 1000,
                        "temperature": 0.3
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result['choices'][0]['message']['content']
                else:
                    print(f"Perplexity API error: {response.status_code} - {response.text}")
                    return self._get_fallback_route_info(route, project_context)
                    
        except Exception as e:
            print(f"Error calling Perplexity API: {e}")
            return self._get_fallback_route_info(route, project_context)

    async def query_project(self, query: str, context: Dict[str, Any], route: str, relevant_context: List[str]) -> str:
        """Answer user queries about the project using AI"""
        
        if not self.api_key:
            return self._get_fallback_query_response(query, context, route)
        
        # Create comprehensive prompt with context
        prompt = self._create_query_prompt(query, context, route, relevant_context)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are an expert software developer and project analyst. Answer questions about software projects with detailed, accurate information based on the provided context."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "max_tokens": 1500,
                        "temperature": 0.2
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result['choices'][0]['message']['content']
                else:
                    print(f"Perplexity API error: {response.status_code} - {response.text}")
                    return self._get_fallback_query_response(query, context, route)
                    
        except Exception as e:
            print(f"Error calling Perplexity API: {e}")
            return self._get_fallback_query_response(query, context, route)

    def _create_route_prompt(self, route: str, project_context: Dict[str, Any]) -> str:
        """Create a prompt for getting route-specific information"""
        
        technologies = project_context.get('technologies', [])
        main_language = project_context.get('main_language', 'Unknown')
        framework = project_context.get('framework')
        
        base_context = f"""
        Project Context:
        - Main Language: {main_language}
        - Framework: {framework or 'Not specified'}
        - Technologies: {', '.join(technologies)}
        - Architecture: {project_context.get('architecture_type', 'Unknown')}
        """
        
        route_prompts = {
            'overview': f"""
            {base_context}
            
            Provide a comprehensive overview of this software project. Include:
            1. Project purpose and functionality
            2. Key technologies and their roles
            3. Overall architecture and design patterns
            4. Main components and their interactions
            5. Development approach and best practices used
            """,
            
            'frontend': f"""
            {base_context}
            
            Analyze the frontend aspects of this project. Focus on:
            1. Frontend framework and libraries used
            2. UI/UX architecture and component structure
            3. State management approach
            4. Styling methodology (CSS, preprocessors, frameworks)
            5. Build tools and development workflow
            6. Browser compatibility and performance considerations
            """,
            
            'backend': f"""
            {base_context}
            
            Analyze the backend aspects of this project. Focus on:
            1. Backend framework and server architecture
            2. API design and endpoints structure
            3. Database integration and data models
            4. Authentication and authorization mechanisms
            5. Middleware and request processing
            6. Error handling and logging strategies
            """,
            
            'database': f"""
            {base_context}
            
            Analyze the database and data management aspects. Focus on:
            1. Database type and technology used
            2. Data models and schema design
            3. Database connections and ORM/ODM usage
            4. Data validation and constraints
            5. Query optimization and indexing
            6. Data migration and seeding strategies
            """,
            
            'architecture': f"""
            {base_context}
            
            Analyze the overall system architecture. Focus on:
            1. Architectural patterns and design principles
            2. System components and their relationships
            3. Data flow and communication patterns
            4. Scalability and performance considerations
            5. Security architecture and measures
            6. Deployment and infrastructure setup
            """,
            
            'flow': f"""
            {base_context}
            
            Describe the project workflow and data flow. Focus on:
            1. User journey and interaction flow
            2. Request/response cycle
            3. Data processing pipeline
            4. Component communication and events
            5. Business logic flow
            6. Integration points with external services
            """
        }
        
        return route_prompts.get(route, f"{base_context}\n\nProvide detailed information about the {route} aspect of this project.")

    def _create_query_prompt(self, query: str, context: Dict[str, Any], route: str, relevant_context: List[str]) -> str:
        """Create a prompt for answering user queries"""
        
        context_info = f"""
        Project Information:
        - Main Language: {context.get('main_language', 'Unknown')}
        - Framework: {context.get('framework', 'Not specified')}
        - Technologies: {', '.join(context.get('technologies', []))}
        - Architecture: {context.get('architecture_type', 'Unknown')}
        - Current Focus: {route}
        
        Relevant Code Context:
        {chr(10).join(relevant_context[:3]) if relevant_context else 'No specific code context available'}
        
        User Question: {query}
        
        Please provide a detailed, technical answer based on the project context above.
        """
        
        return context_info

    def _get_fallback_route_info(self, route: str, project_context: Dict[str, Any]) -> str:
        """Provide fallback information when Perplexity API is not available"""
        
        technologies = project_context.get('technologies', [])
        main_language = project_context.get('main_language', 'Unknown')
        framework = project_context.get('framework')
        
        fallback_responses = {
            'overview': f"""
            <h3>Project Overview</h3>
            <p>This project is primarily built with <strong>{main_language}</strong> and uses the following technologies:</p>
            <ul>{''.join(f'<li>{tech}</li>' for tech in technologies)}</ul>
            
            {f'<p>The project uses the <strong>{framework}</strong> framework as its main foundation.</p>' if framework else ''}
            
            <p>Based on the detected technologies, this appears to be a {project_context.get('architecture_type', 'standard')} application 
            with {project_context.get('files_analyzed', 0)} files analyzed.</p>
            """,
            
            'frontend': f"""
            <h3>Frontend Analysis</h3>
            <p>Frontend technologies detected in this project:</p>
            <ul>
            {''.join(f'<li>{tech}</li>' for tech in technologies if tech in ['React', 'Vue', 'Angular', 'HTML', 'CSS', 'JavaScript', 'TypeScript'])}
            </ul>
            
            <p>The frontend appears to be built with modern web technologies and follows current development practices.</p>
            """,
            
            'backend': f"""
            <h3>Backend Analysis</h3>
            <p>Backend technologies and frameworks detected:</p>
            <ul>
            {''.join(f'<li>{tech}</li>' for tech in technologies if tech in ['Python', 'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring'])}
            </ul>
            
            <p>The backend is structured to handle API requests and business logic processing.</p>
            """,
            
            'database': f"""
            <h3>Database Analysis</h3>
            <p>Database technologies detected in the project:</p>
            <ul>
            {''.join(f'<li>{tech}</li>' for tech in technologies if 'DB' in tech.upper() or tech in ['MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis'])}
            </ul>
            
            <p>The project includes database integration for data persistence and management.</p>
            """,
            
            'architecture': f"""
            <h3>Architecture Analysis</h3>
            <p>This project follows a <strong>{project_context.get('architecture_type', 'standard')}</strong> architecture pattern.</p>
            
            <p>Key architectural components:</p>
            <ul>
            <li>Main Language: {main_language}</li>
            {f'<li>Primary Framework: {framework}</li>' if framework else ''}
            <li>Total Files: {project_context.get('files_analyzed', 0)}</li>
            </ul>
            """,
            
            'flow': f"""
            <h3>Project Flow</h3>
            <p>The project follows a typical {project_context.get('architecture_type', 'application')} flow pattern.</p>
            
            <p>Based on the technologies used ({', '.join(technologies[:5])}), the application likely follows 
            standard request-response patterns with proper separation of concerns.</p>
            """
        }
        
        return fallback_responses.get(route, f"<p>Information about {route} aspect of the project using {main_language} and related technologies.</p>")

    def _get_fallback_query_response(self, query: str, context: Dict[str, Any], route: str) -> str:
        """Provide fallback response when Perplexity API is not available"""
        
        return f"""
        I understand you're asking about: "{query}"
        
        Based on the project context:
        - Main Language: {context.get('main_language', 'Unknown')}
        - Framework: {context.get('framework', 'Not specified')}
        - Current Focus: {route}
        
        While I don't have access to the full AI analysis capabilities right now, I can see that your project 
        uses {', '.join(context.get('technologies', [])[:3])} technologies. 
        
        For more detailed analysis, please ensure the Perplexity API key is configured in the environment variables.
        """

    def health_check(self) -> bool:
        """Check if the Perplexity service is properly configured"""
        return bool(self.api_key)

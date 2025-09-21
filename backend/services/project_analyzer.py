import os
import re
import json
from typing import List, Dict, Any
from pathlib import Path
import ast
import mimetypes

class ProjectAnalyzer:
    def __init__(self):
        self.supported_extensions = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.jsx': 'React',
            '.ts': 'TypeScript',
            '.tsx': 'React TypeScript',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C',
            '.cs': 'C#',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.go': 'Go',
            '.rs': 'Rust',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.scala': 'Scala',
            '.html': 'HTML',
            '.css': 'CSS',
            '.scss': 'SCSS',
            '.sass': 'SASS',
            '.json': 'JSON',
            '.xml': 'XML',
            '.yaml': 'YAML',
            '.yml': 'YAML',
            '.md': 'Markdown',
            '.txt': 'Text'
        }
        
        self.framework_patterns = {
            'React': [r'import.*react', r'from [\'"]react[\'"]', r'React\.'],
            'Vue': [r'import.*vue', r'from [\'"]vue[\'"]', r'Vue\.'],
            'Angular': [r'@angular', r'import.*@angular', r'ng-'],
            'Express': [r'express\(\)', r'require\([\'"]express[\'"]', r'import.*express'],
            'Django': [r'from django', r'import django', r'django\.'],
            'Flask': [r'from flask', r'import flask', r'Flask\('],
            'FastAPI': [r'from fastapi', r'import fastapi', r'FastAPI\('],
            'Spring': [r'@SpringBootApplication', r'import.*springframework', r'@RestController'],
            'Laravel': [r'use Illuminate', r'Illuminate\\', r'<?php.*laravel'],
            'Rails': [r'require [\'"]rails[\'"]', r'Rails\.', r'class.*< ApplicationController']
        }
        
        self.database_patterns = {
            'MongoDB': [r'mongoose', r'mongodb://', r'MongoClient', r'from pymongo'],
            'PostgreSQL': [r'postgresql://', r'psycopg2', r'pg_', r'PostgreSQL'],
            'MySQL': [r'mysql://', r'pymysql', r'mysql2', r'MySQL'],
            'SQLite': [r'sqlite3', r'\.db$', r'sqlite://'],
            'Redis': [r'redis://', r'import redis', r'Redis\('],
            'Firebase': [r'firebase', r'firestore', r'Firebase']
        }

    async def analyze_files(self, file_contents: List[Dict]) -> Dict[str, Any]:
        """Analyze uploaded files and extract project information"""
        
        analysis_result = {
            'summary': '',
            'technologies': [],
            'structure': '',
            'context': {},
            'files_analyzed': len(file_contents),
            'main_language': None,
            'framework': None,
            'architecture_type': None,
            'complexity_score': 0.0,
            'detailed_analysis': {}
        }
        
        # Language detection
        languages = {}
        frameworks = set()
        databases = set()
        
        file_structure = []
        total_lines = 0
        
        for file_info in file_contents:
            filename = file_info['name']
            content = file_info['content']
            
            # Get file extension and language
            ext = Path(filename).suffix.lower()
            language = self.supported_extensions.get(ext, 'Unknown')
            
            if language != 'Unknown':
                languages[language] = languages.get(language, 0) + 1
            
            # Count lines
            lines = len(content.split('\n'))
            total_lines += lines
            
            file_structure.append(f"{filename} ({language}, {lines} lines)")
            
            # Detect frameworks and databases
            content_lower = content.lower()
            
            for framework, patterns in self.framework_patterns.items():
                for pattern in patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        frameworks.add(framework)
                        break
            
            for database, patterns in self.database_patterns.items():
                for pattern in patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        databases.add(database)
                        break
        
        # Determine main language
        if languages:
            analysis_result['main_language'] = max(languages, key=languages.get)
        
        # Determine primary framework
        if frameworks:
            analysis_result['framework'] = list(frameworks)[0]  # Take first detected
        
        # Build technologies list
        technologies = list(languages.keys()) + list(frameworks) + list(databases)
        analysis_result['technologies'] = list(set(technologies))
        
        # Create structure representation
        analysis_result['structure'] = '\n'.join(file_structure)
        
        # Calculate complexity score
        analysis_result['complexity_score'] = min(total_lines / 1000.0, 10.0)
        
        # Determine architecture type
        analysis_result['architecture_type'] = self._determine_architecture(frameworks, languages)
        
        # Generate summary
        analysis_result['summary'] = self._generate_summary(analysis_result)
        
        # Generate detailed analysis for each route
        analysis_result['detailed_analysis'] = self._generate_detailed_analysis(
            file_contents, languages, frameworks, databases
        )
        
        # Store context for future queries
        analysis_result['context'] = {
            'files': file_contents,
            'languages': languages,
            'frameworks': list(frameworks),
            'databases': list(databases),
            'total_lines': total_lines,
            'file_count': len(file_contents)
        }
        
        return analysis_result

    async def analyze_repository(self, repo_data: Dict) -> Dict[str, Any]:
        """Analyze cloned repository data"""
        # Convert repository files to the same format as uploaded files
        file_contents = []
        
        for file_path, content in repo_data.get('files', {}).items():
            file_contents.append({
                'name': file_path,
                'content': content,
                'type': mimetypes.guess_type(file_path)[0]
            })
        
        # Use the same analysis logic
        analysis_result = await self.analyze_files(file_contents)
        
        # Add repository-specific information
        analysis_result['context']['repository'] = {
            'url': repo_data.get('url'),
            'name': repo_data.get('name'),
            'description': repo_data.get('description'),
            'stars': repo_data.get('stars', 0),
            'forks': repo_data.get('forks', 0),
            'language': repo_data.get('language'),
            'topics': repo_data.get('topics', [])
        }
        
        return analysis_result

    def _determine_architecture(self, frameworks: set, languages: dict) -> str:
        """Determine the architecture type based on detected technologies"""
        
        frontend_frameworks = {'React', 'Vue', 'Angular'}
        backend_frameworks = {'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'Laravel', 'Rails'}
        
        has_frontend = bool(frontend_frameworks.intersection(frameworks))
        has_backend = bool(backend_frameworks.intersection(frameworks))
        
        if has_frontend and has_backend:
            return 'Full-stack'
        elif has_frontend:
            return 'Frontend'
        elif has_backend:
            return 'Backend'
        elif 'HTML' in languages and 'CSS' in languages:
            return 'Static Website'
        else:
            return 'Unknown'

    def _generate_summary(self, analysis: Dict[str, Any]) -> str:
        """Generate a human-readable summary of the project"""
        
        main_lang = analysis.get('main_language', 'Unknown')
        framework = analysis.get('framework', 'No specific framework')
        arch_type = analysis.get('architecture_type', 'Unknown')
        file_count = analysis.get('files_analyzed', 0)
        
        summary = f"This is a {arch_type.lower()} project primarily written in {main_lang}"
        
        if framework != 'No specific framework':
            summary += f" using the {framework} framework"
        
        summary += f". The project contains {file_count} files"
        
        if analysis.get('technologies'):
            tech_list = ', '.join(analysis['technologies'][:5])  # Show first 5 technologies
            summary += f" and uses technologies including {tech_list}"
        
        complexity = analysis.get('complexity_score', 0)
        if complexity < 2:
            summary += ". This appears to be a small to medium-sized project."
        elif complexity < 5:
            summary += ". This appears to be a medium-sized project."
        else:
            summary += ". This appears to be a large and complex project."
        
        return summary

    def extract_imports_and_dependencies(self, content: str, language: str) -> List[str]:
        """Extract imports and dependencies from code content"""
        dependencies = []
        
        if language in ['Python']:
            # Python imports
            import_patterns = [
                r'import\s+([a-zA-Z_][a-zA-Z0-9_]*)',
                r'from\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+import',
            ]
            for pattern in import_patterns:
                matches = re.findall(pattern, content)
                dependencies.extend(matches)
                
        elif language in ['JavaScript', 'TypeScript', 'React']:
            # JavaScript/TypeScript imports
            import_patterns = [
                r'import.*from\s+[\'"]([^\'"]+)[\'"]',
                r'require\([\'"]([^\'"]+)[\'"]\)',
            ]
            for pattern in import_patterns:
                matches = re.findall(pattern, content)
                dependencies.extend(matches)
        
        return list(set(dependencies))  # Remove duplicates

    def _generate_detailed_analysis(self, file_contents: List[Dict], languages: Dict, frameworks: set, databases: set) -> Dict[str, Any]:
        """Generate detailed analysis for each route"""
        
        frontend_files = []
        backend_files = []
        database_files = []
        config_files = []
        
        # Categorize files
        for file_info in file_contents:
            filename = file_info['name'].lower()
            content = file_info['content']
            
            if any(ext in filename for ext in ['.jsx', '.tsx', '.vue', '.html', '.css', '.scss']):
                frontend_files.append(file_info)
            elif any(ext in filename for ext in ['.py', '.java', '.php', '.rb', '.go', '.cs']):
                backend_files.append(file_info)
            elif any(ext in filename for ext in ['.sql', '.db']) or 'database' in filename or 'model' in filename:
                database_files.append(file_info)
            elif any(ext in filename for ext in ['.json', '.yaml', '.yml', '.toml', '.ini', '.env']):
                config_files.append(file_info)
        
        return {
            'overview': self._analyze_overview(file_contents, languages, frameworks, databases),
            'frontend': self._analyze_frontend(frontend_files, frameworks),
            'backend': self._analyze_backend(backend_files, frameworks, databases),
            'database': self._analyze_database(database_files, databases),
            'architecture': self._analyze_architecture(file_contents, frameworks, languages),
            'flow': self._analyze_flow(file_contents, frameworks)
        }

    def _analyze_overview(self, files: List[Dict], languages: Dict, frameworks: set, databases: set) -> Dict[str, Any]:
        """Detailed overview analysis"""
        
        key_files = []
        entry_points = []
        
        for file_info in files:
            filename = file_info['name']
            content = file_info['content']
            
            # Identify key files
            if any(key in filename.lower() for key in ['main', 'index', 'app', 'server', 'package.json', 'requirements.txt']):
                key_files.append({
                    'name': filename,
                    'purpose': self._identify_file_purpose(filename, content),
                    'lines': len(content.split('\n'))
                })
            
            # Find entry points
            if 'main(' in content or 'if __name__' in content or 'app.listen' in content:
                entry_points.append(filename)
        
        return {
            'key_files': key_files,
            'entry_points': entry_points,
            'project_type': self._determine_project_type(frameworks, languages),
            'complexity_indicators': self._get_complexity_indicators(files)
        }

    def _analyze_frontend(self, frontend_files: List[Dict], frameworks: set) -> Dict[str, Any]:
        """Detailed frontend analysis"""
        
        components = []
        styles = []
        routing = []
        state_management = []
        
        for file_info in frontend_files:
            filename = file_info['name']
            content = file_info['content']
            
            # Identify components
            if any(ext in filename for ext in ['.jsx', '.tsx', '.vue']):
                components.append({
                    'name': filename,
                    'type': 'Component',
                    'exports': self._extract_exports(content),
                    'imports': self._extract_imports(content)
                })
            
            # Identify styles
            if any(ext in filename for ext in ['.css', '.scss', '.sass']):
                styles.append({
                    'name': filename,
                    'type': 'Stylesheet',
                    'classes': self._extract_css_classes(content)
                })
            
            # Check for routing
            if 'router' in content.lower() or 'route' in content.lower():
                routing.append(filename)
            
            # Check for state management
            if any(pattern in content.lower() for pattern in ['usestate', 'redux', 'vuex', 'context']):
                state_management.append(filename)
        
        return {
            'components': components,
            'styles': styles,
            'routing_files': routing,
            'state_management': state_management,
            'frameworks_used': list(frameworks.intersection({'React', 'Vue', 'Angular'}))
        }

    def _analyze_backend(self, backend_files: List[Dict], frameworks: set, databases: set) -> Dict[str, Any]:
        """Detailed backend analysis"""
        
        apis = []
        models = []
        middleware = []
        
        for file_info in backend_files:
            filename = file_info['name']
            content = file_info['content']
            
            # Identify API endpoints
            endpoints = self._extract_api_endpoints(content)
            if endpoints:
                apis.append({
                    'file': filename,
                    'endpoints': endpoints
                })
            
            # Identify models
            if 'model' in filename.lower() or 'schema' in filename.lower():
                models.append({
                    'file': filename,
                    'models': self._extract_models(content)
                })
            
            # Check for middleware
            if 'middleware' in content.lower() or '@app.middleware' in content:
                middleware.append(filename)
        
        return {
            'api_files': apis,
            'models': models,
            'middleware': middleware,
            'frameworks_used': list(frameworks.intersection({'Django', 'Flask', 'FastAPI', 'Express', 'Spring'})),
            'databases_used': list(databases)
        }

    def _analyze_database(self, database_files: List[Dict], databases: set) -> Dict[str, Any]:
        """Detailed database analysis"""
        
        schemas = []
        migrations = []
        
        for file_info in database_files:
            filename = file_info['name']
            content = file_info['content']
            
            if '.sql' in filename:
                schemas.append({
                    'file': filename,
                    'tables': self._extract_sql_tables(content)
                })
            
            if 'migration' in filename.lower():
                migrations.append(filename)
        
        return {
            'schemas': schemas,
            'migrations': migrations,
            'databases_detected': list(databases)
        }

    def _analyze_architecture(self, files: List[Dict], frameworks: set, languages: Dict) -> Dict[str, Any]:
        """Detailed architecture analysis"""
        
        patterns = []
        layers = []
        
        # Detect architectural patterns
        if any('controller' in f['name'].lower() for f in files):
            patterns.append('MVC')
        if any('service' in f['name'].lower() for f in files):
            patterns.append('Service Layer')
        if any('repository' in f['name'].lower() for f in files):
            patterns.append('Repository Pattern')
        
        # Identify layers
        for file_info in files:
            filename = file_info['name'].lower()
            if 'controller' in filename:
                layers.append('Controller Layer')
            elif 'service' in filename:
                layers.append('Service Layer')
            elif 'model' in filename or 'entity' in filename:
                layers.append('Data Layer')
        
        return {
            'patterns': list(set(patterns)),
            'layers': list(set(layers)),
            'separation_of_concerns': len(set(layers)) > 1
        }

    def _analyze_flow(self, files: List[Dict], frameworks: set) -> Dict[str, Any]:
        """Detailed flow analysis"""
        
        return {
            'data_flow': self._analyze_data_flow(files),
            'request_flow': self._analyze_request_flow(files),
            'component_hierarchy': self._analyze_component_hierarchy(files)
        }

    # Helper methods for detailed analysis
    def _identify_file_purpose(self, filename: str, content: str) -> str:
        """Identify the purpose of a file"""
        filename_lower = filename.lower()
        
        if 'package.json' in filename_lower:
            return 'Node.js package configuration'
        elif 'requirements.txt' in filename_lower:
            return 'Python dependencies'
        elif 'main' in filename_lower:
            return 'Application entry point'
        elif 'index' in filename_lower:
            return 'Index/entry file'
        elif 'app' in filename_lower:
            return 'Main application file'
        elif 'config' in filename_lower:
            return 'Configuration file'
        else:
            return 'Source file'

    def _extract_exports(self, content: str) -> List[str]:
        """Extract exports from JavaScript/TypeScript content"""
        exports = []
        export_patterns = [
            r'export\s+(?:default\s+)?(?:function\s+)?(\w+)',
            r'export\s*{\s*([^}]+)\s*}',
        ]
        
        for pattern in export_patterns:
            matches = re.findall(pattern, content)
            exports.extend(matches)
        
        return exports

    def _extract_imports(self, content: str) -> List[str]:
        """Extract imports from content"""
        imports = []
        import_patterns = [
            r'import\s+.*from\s+[\'"]([^\'"]+)[\'"]',
            r'require\([\'"]([^\'"]+)[\'"]\)',
        ]
        
        for pattern in import_patterns:
            matches = re.findall(pattern, content)
            imports.extend(matches)
        
        return imports

    def _extract_css_classes(self, content: str) -> List[str]:
        """Extract CSS class names"""
        classes = re.findall(r'\.([a-zA-Z_-][a-zA-Z0-9_-]*)', content)
        return list(set(classes))

    def _extract_api_endpoints(self, content: str) -> List[Dict]:
        """Extract API endpoints from backend code"""
        endpoints = []
        
        # FastAPI/Flask patterns
        patterns = [
            r'@app\.(get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"]',
            r'@router\.(get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"]',
            r'app\.(get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"]',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for method, path in matches:
                endpoints.append({'method': method.upper(), 'path': path})
        
        return endpoints

    def _extract_models(self, content: str) -> List[str]:
        """Extract model/class names"""
        models = []
        
        # Python class pattern
        class_matches = re.findall(r'class\s+(\w+)', content)
        models.extend(class_matches)
        
        return models

    def _extract_sql_tables(self, content: str) -> List[str]:
        """Extract table names from SQL"""
        tables = []
        
        # CREATE TABLE pattern
        table_matches = re.findall(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)', content, re.IGNORECASE)
        tables.extend(table_matches)
        
        return tables

    def _determine_project_type(self, frameworks: set, languages: Dict) -> str:
        """Determine the type of project"""
        if frameworks.intersection({'React', 'Vue', 'Angular'}):
            return 'Frontend Application'
        elif frameworks.intersection({'Django', 'Flask', 'FastAPI', 'Express'}):
            return 'Backend API'
        elif 'HTML' in languages and 'CSS' in languages:
            return 'Web Application'
        else:
            return 'Software Project'

    def _get_complexity_indicators(self, files: List[Dict]) -> Dict[str, Any]:
        """Get complexity indicators"""
        total_files = len(files)
        total_lines = sum(len(f['content'].split('\n')) for f in files)
        
        return {
            'total_files': total_files,
            'total_lines': total_lines,
            'avg_lines_per_file': total_lines // total_files if total_files > 0 else 0,
            'complexity_level': 'Low' if total_lines < 1000 else 'Medium' if total_lines < 5000 else 'High'
        }

    def _analyze_data_flow(self, files: List[Dict]) -> List[str]:
        """Analyze data flow patterns"""
        flows = []
        
        for file_info in files:
            content = file_info['content']
            if 'fetch(' in content or 'axios' in content:
                flows.append('HTTP API calls')
            if 'useState' in content or 'state' in content:
                flows.append('State management')
            if 'props' in content:
                flows.append('Component props')
        
        return list(set(flows))

    def _analyze_request_flow(self, files: List[Dict]) -> List[str]:
        """Analyze request flow patterns"""
        flows = []
        
        for file_info in files:
            content = file_info['content']
            if '@app.route' in content or '@router' in content:
                flows.append('Route handling')
            if 'middleware' in content.lower():
                flows.append('Middleware processing')
            if 'authenticate' in content.lower() or 'auth' in content.lower():
                flows.append('Authentication')
        
        return list(set(flows))

    def _analyze_component_hierarchy(self, files: List[Dict]) -> Dict[str, Any]:
        """Analyze component hierarchy"""
        components = []
        
        for file_info in files:
            filename = file_info['name']
            if any(ext in filename for ext in ['.jsx', '.tsx', '.vue']):
                components.append(filename)
        
        return {
            'total_components': len(components),
            'component_files': components[:10]  # Show first 10
        }

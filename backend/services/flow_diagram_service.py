from typing import Dict, Any, List
import re

class FlowDiagramService:
    """Generate a simple project flow diagram (Mermaid) from project context"""

    async def generate_diagram(self, project_context: Dict[str, Any]) -> Dict[str, Any]:
        files = project_context.get('files', [])
        frameworks = set(project_context.get('frameworks', []))
        databases = set(project_context.get('databases', [])) if project_context.get('databases') else set()
        main_language = project_context.get('main_language', 'Unknown')

        # Detect frontend/backend presence heuristically
        has_frontend = any(fw in {'React', 'Vue', 'Angular'} for fw in frameworks) or self._has_frontend_dirs(files)
        has_backend = any(fw in {'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'Laravel', 'Rails'} for fw in frameworks) or self._has_backend_dirs(files)
        has_db = bool(databases) or self._has_db_files(files)

        nodes = []
        edges = []

        # Base nodes
        nodes.append({'id': 'user', 'label': 'User', 'type': 'actor', 'position': {'x': 0, 'y': 0}})
        if has_frontend:
            nodes.append({'id': 'frontend', 'label': 'Frontend UI', 'type': 'component', 'position': {'x': 200, 'y': 0}})
            edges.append({'id': 'e1', 'source': 'user', 'target': 'frontend', 'label': 'interacts'})
        if has_backend:
            nodes.append({'id': 'backend', 'label': 'Backend API', 'type': 'service', 'position': {'x': 450, 'y': 0}})
            source = 'frontend' if has_frontend else 'user'
            edges.append({'id': 'e2', 'source': source, 'target': 'backend', 'label': 'HTTP/REST'})
        if has_db:
            nodes.append({'id': 'db', 'label': 'Database', 'type': 'database', 'position': {'x': 700, 'y': 0}})
            if has_backend:
                edges.append({'id': 'e3', 'source': 'backend', 'target': 'db', 'label': 'CRUD'})

        # Build Mermaid diagram
        mermaid_lines = ["graph LR"]
        mermaid_lines.append("    user([User])")
        if has_frontend:
            mermaid_lines.append("    frontend[[Frontend UI]])" if False else "    frontend[[Frontend UI]]")
            mermaid_lines.append("    user -->|interacts| frontend")
        if has_backend:
            mermaid_lines.append("    backend[(Backend API)])" if False else "    backend[(Backend API)]")
            src = 'frontend' if has_frontend else 'user'
            mermaid_lines.append(f"    {src} -->|HTTP/REST| backend")
        if has_db:
            mermaid_lines.append("    db[(Database)])" if False else "    db[(Database)]")
            if has_backend:
                mermaid_lines.append("    backend -->|CRUD| db")

        # Add technology annotations
        tech_badges = []
        if frameworks:
            tech_badges.append(f"Frameworks: {', '.join(sorted(frameworks))}")
        if databases:
            tech_badges.append(f"Databases: {', '.join(sorted(databases))}")
        if main_language and main_language != 'Unknown':
            tech_badges.append(f"Language: {main_language}")
        if tech_badges:
            # Mermaid note
            mermaid_lines.append(f"    note1[/{' | '.join(tech_badges)}/]")
            attach_to = 'frontend' if has_frontend else ('backend' if has_backend else 'user')
            mermaid_lines.append(f"    note1 --- {attach_to}")

        mermaid = "\n".join(mermaid_lines)

        return {
            'mermaid': mermaid,
            'nodes': nodes,
            'edges': edges
        }

    def _has_frontend_dirs(self, files: List[Dict[str, Any]]) -> bool:
        paths = [f.get('name', '') for f in files if isinstance(f, dict)]
        return any(re.search(r"(^|/)src/.*\.(jsx?|tsx?)$", p, re.IGNORECASE) for p in paths)

    def _has_backend_dirs(self, files: List[Dict[str, Any]]) -> bool:
        paths = [f.get('name', '') for f in files if isinstance(f, dict)]
        return any(
            re.search(r"(^|/)(server|api|backend)/", p, re.IGNORECASE) or p.endswith('.py') for p in paths
        )

    def _has_db_files(self, files: List[Dict[str, Any]]) -> bool:
        contents = [(f.get('name', ''), f.get('content', '')) for f in files if isinstance(f, dict)]
        for name, content in contents:
            if re.search(r"(mongodb|postgres|mysql|sqlite|redis|prisma|sequelize|typeorm|psycopg2)", content, re.IGNORECASE):
                return True
            if name.lower().endswith(('.sql',)):
                return True
        return False

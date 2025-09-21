import os
import tempfile
import shutil
from typing import Dict, Any, Optional
import git
from github import Github
from pathlib import Path
import mimetypes

class GitHubService:
    def __init__(self):
        self.github_token = os.getenv('GITHUB_TOKEN')
        self.github_client = Github(self.github_token) if self.github_token else None
        
        # File extensions to analyze (avoid binary files)
        self.text_extensions = {
            '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c', '.cs',
            '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.html',
            '.css', '.scss', '.sass', '.json', '.xml', '.yaml', '.yml', '.md',
            '.txt', '.sql', '.sh', '.bat', '.ps1', '.dockerfile', '.gitignore',
            '.env', '.config', '.ini', '.toml'
        }
        
        # Maximum file size to process (1MB)
        self.max_file_size = 1024 * 1024

    async def clone_and_analyze(self, github_url: str) -> Dict[str, Any]:
        """Clone a GitHub repository and extract its contents for analysis"""
        
        try:
            # Parse GitHub URL to get owner and repo name
            repo_info = self._parse_github_url(github_url)
            if not repo_info:
                raise ValueError("Invalid GitHub URL format")
            
            # Get repository metadata if GitHub token is available
            repo_metadata = {}
            if self.github_client:
                try:
                    repo = self.github_client.get_repo(f"{repo_info['owner']}/{repo_info['repo']}")
                    repo_metadata = {
                        'name': repo.name,
                        'description': repo.description,
                        'stars': repo.stargazers_count,
                        'forks': repo.forks_count,
                        'language': repo.language,
                        'topics': repo.get_topics(),
                        'created_at': repo.created_at.isoformat(),
                        'updated_at': repo.updated_at.isoformat(),
                        'size': repo.size
                    }
                except Exception as e:
                    print(f"Could not fetch repository metadata: {e}")
            
            # Create temporary directory for cloning
            with tempfile.TemporaryDirectory() as temp_dir:
                repo_path = Path(temp_dir) / repo_info['repo']
                
                # Clone the repository
                git.Repo.clone_from(github_url, repo_path, depth=1)  # Shallow clone
                
                # Extract file contents
                files = {}
                file_count = 0
                total_size = 0
                
                for file_path in repo_path.rglob('*'):
                    if file_path.is_file() and file_count < 200:  # Limit number of files
                        relative_path = file_path.relative_to(repo_path)
                        
                        # Skip certain directories and files
                        if self._should_skip_file(relative_path):
                            continue
                        
                        # Check file extension
                        if file_path.suffix.lower() not in self.text_extensions:
                            continue
                        
                        # Check file size
                        if file_path.stat().st_size > self.max_file_size:
                            continue
                        
                        try:
                            # Read file content
                            content = file_path.read_text(encoding='utf-8', errors='ignore')
                            files[str(relative_path)] = content
                            file_count += 1
                            total_size += len(content)
                            
                            # Limit total content size (10MB)
                            if total_size > 10 * 1024 * 1024:
                                break
                                
                        except Exception as e:
                            print(f"Could not read file {relative_path}: {e}")
                            continue
                
                return {
                    'url': github_url,
                    'files': files,
                    'file_count': file_count,
                    'total_size': total_size,
                    **repo_metadata
                }
                
        except Exception as e:
            raise Exception(f"Failed to clone and analyze repository: {str(e)}")

    def _parse_github_url(self, url: str) -> Optional[Dict[str, str]]:
        """Parse GitHub URL to extract owner and repository name"""
        import re
        
        # Support various GitHub URL formats
        patterns = [
            r'https://github\.com/([^/]+)/([^/]+)(?:\.git)?/?$',
            r'git@github\.com:([^/]+)/([^/]+)(?:\.git)?$',
            r'https://www\.github\.com/([^/]+)/([^/]+)(?:\.git)?/?$'
        ]
        
        for pattern in patterns:
            match = re.match(pattern, url.strip())
            if match:
                owner, repo = match.groups()
                # Remove .git suffix if present
                if repo.endswith('.git'):
                    repo = repo[:-4]
                return {'owner': owner, 'repo': repo}
        
        return None

    def _should_skip_file(self, file_path: Path) -> bool:
        """Determine if a file should be skipped during analysis"""
        
        # Skip hidden files and directories
        if any(part.startswith('.') for part in file_path.parts):
            # But allow some important config files
            allowed_hidden = {'.env', '.gitignore', '.dockerignore', '.eslintrc', '.prettierrc'}
            if file_path.name not in allowed_hidden:
                return True
        
        # Skip common directories
        skip_dirs = {
            'node_modules', '__pycache__', '.git', '.vscode', '.idea',
            'venv', 'env', 'build', 'dist', 'target', 'bin', 'obj',
            'logs', 'tmp', 'temp', 'cache', '.next', '.nuxt'
        }
        
        if any(part in skip_dirs for part in file_path.parts):
            return True
        
        # Skip binary and large files
        skip_extensions = {
            '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico',
            '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm',
            '.mp3', '.wav', '.ogg', '.flac', '.aac',
            '.zip', '.tar', '.gz', '.rar', '.7z',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
        }
        
        if file_path.suffix.lower() in skip_extensions:
            return True
        
        return False

    def get_repository_structure(self, repo_path: Path) -> str:
        """Generate a tree-like structure representation of the repository"""
        
        def build_tree(path: Path, prefix: str = "", is_last: bool = True) -> str:
            if self._should_skip_file(path.relative_to(repo_path)):
                return ""
            
            tree_str = ""
            connector = "└── " if is_last else "├── "
            tree_str += f"{prefix}{connector}{path.name}\n"
            
            if path.is_dir():
                children = sorted([p for p in path.iterdir() if not self._should_skip_file(p.relative_to(repo_path))])
                for i, child in enumerate(children):
                    is_last_child = i == len(children) - 1
                    extension = "    " if is_last else "│   "
                    tree_str += build_tree(child, prefix + extension, is_last_child)
            
            return tree_str
        
        return build_tree(repo_path)

    def health_check(self) -> bool:
        """Check if the GitHub service is properly configured"""
        try:
            # Test git availability
            git.Repo.init(tempfile.mkdtemp(), bare=True)
            return True
        except Exception:
            return False

    async def get_repository_info(self, github_url: str) -> Dict[str, Any]:
        """Get repository information without cloning"""
        if not self.github_client:
            raise Exception("GitHub token not configured")
        
        repo_info = self._parse_github_url(github_url)
        if not repo_info:
            raise ValueError("Invalid GitHub URL format")
        
        try:
            repo = self.github_client.get_repo(f"{repo_info['owner']}/{repo_info['repo']}")
            
            return {
                'name': repo.name,
                'full_name': repo.full_name,
                'description': repo.description,
                'stars': repo.stargazers_count,
                'forks': repo.forks_count,
                'language': repo.language,
                'topics': repo.get_topics(),
                'created_at': repo.created_at.isoformat(),
                'updated_at': repo.updated_at.isoformat(),
                'size': repo.size,
                'open_issues': repo.open_issues_count,
                'license': repo.license.name if repo.license else None,
                'default_branch': repo.default_branch
            }
        except Exception as e:
            raise Exception(f"Failed to get repository info: {str(e)}")

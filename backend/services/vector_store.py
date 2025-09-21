import os
from typing import List, Dict, Any, Optional
import uuid
import json

class VectorStore:
    def __init__(self):
        self.persist_directory = os.getenv('CHROMA_PERSIST_DIRECTORY', './chroma_db')
        self.client = None  # type: ignore
        self.collection = None  # type: ignore
        self.embedding_model = None  # type: ignore
        
    async def initialize(self):
        """Initialize ChromaDB and embedding model"""
        try:
            # Lazy import heavy deps
            import chromadb  # type: ignore
            from chromadb.config import Settings  # type: ignore
            from sentence_transformers import SentenceTransformer  # type: ignore

            # Initialize ChromaDB client
            self.client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name="project_analysis",
                metadata={"description": "Project analysis and code embeddings"}
            )
            
            # Initialize embedding model
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            print("Vector store initialized successfully")
            
        except Exception as e:
            print(f"Error initializing vector store: {e}")
            # Fallback to in-memory storage
            try:
                import chromadb  # type: ignore
                self.client = chromadb.Client()
                self.collection = self.client.get_or_create_collection(
                    name="project_analysis",
                    metadata={"description": "Project analysis and code embeddings"}
                )
            except Exception as e2:
                print(f"Error initializing in-memory vector store: {e2}")
                self.client = None
                self.collection = None
            # Delay embedding model; queries will no-op if not available
            self.embedding_model = None

    async def store_project_data(self, analysis_result: Dict[str, Any]):
        """Store project analysis data in vector database"""
        if not self.collection or not self.embedding_model:
            await self.initialize()
        
        try:
            documents = []
            metadatas = []
            ids = []
            
            # Store project summary
            documents.append(analysis_result.get('summary', ''))
            metadatas.append({
                'type': 'summary',
                'main_language': analysis_result.get('main_language', ''),
                'framework': analysis_result.get('framework', ''),
                'architecture': analysis_result.get('architecture_type', '')
            })
            ids.append(f"summary_{uuid.uuid4()}")
            
            # Store technology information
            tech_text = f"Technologies used: {', '.join(analysis_result.get('technologies', []))}"
            documents.append(tech_text)
            metadatas.append({
                'type': 'technologies',
                'technologies': json.dumps(analysis_result.get('technologies', []))
            })
            ids.append(f"tech_{uuid.uuid4()}")
            
            # Store file structure
            if analysis_result.get('structure'):
                documents.append(f"Project structure:\n{analysis_result['structure']}")
                metadatas.append({
                    'type': 'structure',
                    'file_count': analysis_result.get('files_analyzed', 0)
                })
                ids.append(f"structure_{uuid.uuid4()}")
            
            # Store individual file contents (if available in context)
            context = analysis_result.get('context', {})
            files = context.get('files', [])
            
            for i, file_info in enumerate(files[:50]):  # Limit to 50 files
                if isinstance(file_info, dict) and 'content' in file_info:
                    content = file_info['content']
                    filename = file_info.get('name', f'file_{i}')
                    
                    # Only store files with meaningful content
                    if len(content.strip()) > 50:
                        documents.append(f"File: {filename}\n{content[:2000]}")  # Limit content size
                        metadatas.append({
                            'type': 'file_content',
                            'filename': filename,
                            'file_type': file_info.get('type', 'unknown')
                        })
                        ids.append(f"file_{uuid.uuid4()}")
            
            # Generate embeddings and store
            if documents and self.embedding_model and self.collection:
                embeddings = self.embedding_model.encode(documents).tolist()
                
                self.collection.add(
                    embeddings=embeddings,
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
                
                print(f"Stored {len(documents)} documents in vector database")
            
        except Exception as e:
            print(f"Error storing project data: {e}")

    async def search_similar(self, query: str, n_results: int = 5) -> List[str]:
        """Search for similar content based on query"""
        if not self.collection or not self.embedding_model:
            return []
        
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query]).tolist()
            
            # Search for similar documents
            results = self.collection.query(
                query_embeddings=query_embedding,
                n_results=n_results,
                include=['documents', 'metadatas', 'distances']
            )
            
            # Return relevant documents
            documents = results.get('documents', [[]])[0]
            return documents
            
        except Exception as e:
            print(f"Error searching vector store: {e}")
            return []

    async def search_by_type(self, content_type: str, n_results: int = 10) -> List[Dict[str, Any]]:
        """Search for content by type (summary, technologies, structure, file_content)"""
        if not self.collection:
            return []
        
        try:
            results = self.collection.get(
                where={"type": content_type},
                limit=n_results,
                include=['documents', 'metadatas']
            )
            
            documents = results.get('documents', [])
            metadatas = results.get('metadatas', [])
            
            return [
                {'document': doc, 'metadata': meta}
                for doc, meta in zip(documents, metadatas)
            ]
            
        except Exception as e:
            print(f"Error searching by type: {e}")
            return []

    async def get_project_context(self, query: str) -> Dict[str, Any]:
        """Get comprehensive project context for a query"""
        context = {
            'summary': [],
            'technologies': [],
            'structure': [],
            'relevant_files': []
        }
        
        try:
            # Get summary information
            summary_results = await self.search_by_type('summary', 1)
            if summary_results:
                context['summary'] = [result['document'] for result in summary_results]
            
            # Get technology information
            tech_results = await self.search_by_type('technologies', 1)
            if tech_results:
                context['technologies'] = [result['document'] for result in tech_results]
            
            # Get structure information
            structure_results = await self.search_by_type('structure', 1)
            if structure_results:
                context['structure'] = [result['document'] for result in structure_results]
            
            # Get relevant file content
            relevant_files = await self.search_similar(query, 3)
            context['relevant_files'] = relevant_files
            
        except Exception as e:
            print(f"Error getting project context: {e}")
        
        return context

    async def clear_collection(self):
        """Clear all data from the collection"""
        if self.collection:
            try:
                # Get all IDs and delete them
                all_data = self.collection.get()
                if all_data.get('ids'):
                    self.collection.delete(ids=all_data['ids'])
                print("Collection cleared successfully")
            except Exception as e:
                print(f"Error clearing collection: {e}")

    async def health_check(self) -> bool:
        """Check if vector store is working properly"""
        try:
            if not self.collection:
                await self.initialize()
            
            # Try a simple operation
            if self.collection:
                self.collection.count()
            return True
        except Exception as e:
            print(f"Vector store health check failed: {e}")
            return False

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the collection"""
        if not self.collection:
            return {'error': 'Collection not initialized'}
        
        try:
            count = self.collection.count()
            
            # Get type distribution
            all_data = self.collection.get(include=['metadatas'])
            type_counts = {}
            
            for metadata in all_data.get('metadatas', []):
                content_type = metadata.get('type', 'unknown')
                type_counts[content_type] = type_counts.get(content_type, 0) + 1
            
            return {
                'total_documents': count,
                'type_distribution': type_counts,
                'persist_directory': self.persist_directory
            }
            
        except Exception as e:
            return {'error': str(e)}

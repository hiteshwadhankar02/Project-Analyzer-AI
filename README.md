# Project Analyzer AI

An intelligent AI-powered tool that helps you understand any software project by analyzing its structure, technologies, and implementation patterns. Simply upload your project files or provide a GitHub URL, and get comprehensive insights about the codebase.

## Features

- 📁 **Multiple Input Methods**: Upload files directly or analyze GitHub repositories
- 🤖 **AI-Powered Analysis**: Uses Perplexity API for intelligent project understanding
- 🔍 **Interactive Exploration**: Navigate through different aspects (Frontend, Backend, Database, Architecture)
- 💬 **Natural Language Queries**: Ask questions about your project in plain English
- 🗂️ **Vector Search**: Semantic search through your codebase using ChromaDB and Hugging Face embeddings
- 📊 **Project Flow Diagrams**: Visual representation of your project structure
- 🎯 **Route-Based Navigation**: Focus on specific areas of interest

## Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **FastAPI** - High-performance Python API framework
- **ChromaDB** - Vector database for semantic search
- **Sentence Transformers** - Hugging Face embeddings
- **Perplexity API** - AI-powered analysis and responses
- **GitPython** - GitHub repository handling
- **PyGithub** - GitHub API integration

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- Git

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd project-analyzer
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file and configure
copy .env.example .env
```

### 3. Configure Environment Variables

Edit the `.env` file in the backend directory:

```env
# Required: Get from https://www.perplexity.ai/
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Optional: For private GitHub repositories
GITHUB_TOKEN=your_github_token_here

# Optional: For custom Hugging Face models
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# ChromaDB Configuration
CHROMA_PERSIST_DIRECTORY=./chroma_db

# FastAPI Configuration
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

### 4. Frontend Setup

```bash
cd ../  # Go back to root directory
cd project-analyzer  # Enter the React app directory

# Install dependencies
npm install
```

### 5. Running the Application

#### Start the Backend Server

```bash
cd backend
python main.py
```

The backend will be available at `http://localhost:8000`

#### Start the Frontend Development Server

```bash
cd project-analyzer  # React app directory
npm start
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Core Analysis Endpoints

- `POST /api/analyze-files` - Analyze uploaded project files
- `POST /api/analyze-github` - Analyze GitHub repository
- `POST /api/get-route-info` - Get specific route information
- `POST /api/query` - Query project with natural language

### Health Check

- `GET /api/health` - Check service status
- `GET /` - API root endpoint

## Usage Guide

### 1. Upload Your Project

Choose between two input methods:
- **File Upload**: Select and upload your project files
- **GitHub URL**: Provide a public GitHub repository URL

### 2. Explore Your Project

Navigate through different aspects:
- **Overview**: General project summary and technologies
- **Frontend**: UI framework, components, and styling
- **Backend**: Server architecture, APIs, and business logic
- **Database**: Data models, connections, and queries
- **Architecture**: System design and patterns
- **Project Flow**: Data flow and component interactions

### 3. Ask Questions

Use the query box to ask specific questions about your project:
- "How does authentication work in this project?"
- "What are the main API endpoints?"
- "Explain the database schema"
- "How is state management handled?"

## Supported File Types

The analyzer supports a wide range of programming languages and file types:

- **Languages**: Python, JavaScript, TypeScript, Java, C++, C#, PHP, Ruby, Go, Rust, Swift, Kotlin, Scala
- **Web**: HTML, CSS, SCSS, SASS
- **Config**: JSON, XML, YAML, Dockerfile, .env files
- **Documentation**: Markdown, Text files

## API Key Setup

### Perplexity API Key (Required)

1. Visit [Perplexity AI](https://www.perplexity.ai/)
2. Sign up for an account
3. Navigate to API settings
4. Generate an API key
5. Add it to your `.env` file

### GitHub Token (Optional)

For private repositories or higher rate limits:

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with `repo` scope
3. Add it to your `.env` file

## Troubleshooting

### Common Issues

1. **Backend not starting**: Check if all Python dependencies are installed and virtual environment is activated
2. **Frontend not loading**: Ensure Node.js dependencies are installed with `npm install`
3. **API errors**: Verify your Perplexity API key is correctly set in the `.env` file
4. **GitHub analysis failing**: Check if the repository URL is correct and accessible

### Logs and Debugging

- Backend logs are displayed in the terminal where you run `python main.py`
- Frontend logs are available in the browser's developer console
- Set `DEBUG=True` in your `.env` file for detailed backend logging

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed information about your problem

## Roadmap

- [ ] Support for more programming languages
- [ ] Advanced code metrics and complexity analysis
- [ ] Integration with more AI providers
- [ ] Real-time collaboration features
- [ ] Project comparison capabilities
- [ ] Export analysis reports
- [ ] Plugin system for custom analyzers

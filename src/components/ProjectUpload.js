import React, { useState } from 'react';
import { Upload, Github, FileText, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProjectUpload = ({ onProjectSubmit, onAnalysisComplete }) => {
  const [uploadType, setUploadType] = useState('file');
  const [githubUrl, setGithubUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    setError('');
  };

  const handleGithubUrlChange = (event) => {
    setGithubUrl(event.target.value);
    setError('');
  };

  const analyzeProject = async () => {
    setIsAnalyzing(true);
    setError('');

    try {
      let response;
      
      if (uploadType === 'file') {
        if (selectedFiles.length === 0) {
          setError('Please select files to analyze');
          setIsAnalyzing(false);
          return;
        }

        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });

        response = await axios.post('http://localhost:8000/api/analyze-files', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        if (!githubUrl.trim()) {
          setError('Please enter a GitHub URL');
          setIsAnalyzing(false);
          return;
        }

        response = await axios.post('http://localhost:8000/api/analyze-github', {
          github_url: githubUrl,
        });
      }

      const projectData = {
        type: uploadType,
        data: uploadType === 'file' ? selectedFiles : githubUrl,
      };

      onProjectSubmit(projectData);
      onAnalysisComplete(response.data);
      navigate('/analysis');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze project. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-effect rounded-2xl p-8 shadow-2xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Choose Your Project Input Method
          </h2>
          
          {/* Upload Type Selection */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setUploadType('file')}
                className={`flex items-center px-6 py-3 rounded-md transition-all ${
                  uploadType === 'file'
                    ? 'bg-white text-gray-800 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Files
              </button>
              <button
                onClick={() => setUploadType('github')}
                className={`flex items-center px-6 py-3 rounded-md transition-all ${
                  uploadType === 'github'
                    ? 'bg-white text-gray-800 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Github className="w-5 h-5 mr-2" />
                GitHub URL
              </button>
            </div>
          </div>

          {/* File Upload Section */}
          {uploadType === 'file' && (
            <div className="mb-6">
              <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center hover:border-white/50 transition-colors">
                <FileText className="w-12 h-12 text-white/60 mx-auto mb-4" />
                <p className="text-white/80 mb-4">
                  Select project files to analyze
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.html,.css,.json,.xml,.yaml,.yml,.md,.txt"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Choose Files
                </label>
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-white/80 mb-2">Selected files:</p>
                    <div className="text-sm text-white/60">
                      {selectedFiles.map((file, index) => (
                        <div key={index}>{file.name}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GitHub URL Section */}
          {uploadType === 'github' && (
            <div className="mb-6">
              <label className="block text-white/80 mb-2">
                GitHub Repository URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={handleGithubUrlChange}
                placeholder="https://github.com/username/repository"
                className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/50 border border-white/20 focus:border-white/50 focus:outline-none"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Analyze Button */}
          <div className="text-center">
            <button
              onClick={analyzeProject}
              disabled={isAnalyzing}
              className="inline-flex items-center px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
            >
              {isAnalyzing ? (
                <>
                  <Loader className="w-6 h-6 mr-3 animate-spin" />
                  Analyzing Project...
                </>
              ) : (
                <>
                  <FileText className="w-6 h-6 mr-3" />
                  Analyze Project
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectUpload;

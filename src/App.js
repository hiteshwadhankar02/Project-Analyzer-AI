import React, { useState } from 'react';
import ProjectUpload from './components/ProjectUpload';
import ProjectAnalysis from './components/ProjectAnalysis';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  const [projectData, setProjectData] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleAnalysisComplete = (result) => {
    console.log('Analysis completed:', result);
    try {
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error setting analysis result:', error);
    }
  };

  return (
    <Router>
      <div className="min-h-screen gradient-bg">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Project Analyzer AI
            </h1>
            <p className="text-xl text-white/80">
              Understand any codebase with AI-powered analysis
            </p>
          </header>

          <Routes>
            <Route 
              path="/" 
              element={
                <ProjectUpload 
                  onProjectSubmit={setProjectData}
                  onAnalysisComplete={handleAnalysisComplete}
                />
              } 
            />
            <Route 
              path="/analysis" 
              element={
                <ProjectAnalysis 
                  projectData={projectData}
                  analysisResult={analysisResult}
                />
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

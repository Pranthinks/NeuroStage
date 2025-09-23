import React, { useState } from 'react';

const HomePage = ({ setCurrentPage, logout }) => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');
  const [showResult, setShowResult] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a file first!');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Show loading
    setShowResult(true);
    setResult(`
      <div class="loading">
        <div class="spinner"></div>
        <strong>Processing your DICOM files...</strong>
        <div class="progress-steps">
          <div class="step active">📤 Uploading ZIP file</div>
          <div class="step">📁 Extracting DICOM files</div>
          <div class="step">🔄 Converting to NIfTI format</div>
          <div class="step">✅ Saving converted files</div>
        </div>
      </div>
    `);
    
    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setResult(`
          <div class="result">
            <strong>🎉 Conversion Completed Successfully!</strong><br>
            📂 Files saved in: <code>${data.folder_path}</code><br>
            <small>You can find your converted NIfTI files in the output subfolder</small>
          </div>
        `);
      } else {
        setResult(`
          <div class="result" style="background: #f8d7da; color: #721c24;">
            <strong>❌ Error:</strong><br>${data.message}
          </div>
        `);
      }
    } catch (error) {
      setResult(`
        <div class="result" style="background: #f8d7da; color: #721c24;">
          <strong>❌ Network Error:</strong><br>${error.message}
        </div>
      `);
    }
  };

  return (
    <div>
      <style>{`
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        
        .container {
          background: white;
          padding: 40px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          text-align: center;
        }
        
        h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 28px;
        }
        
        .subtitle {
          color: #666;
          margin-bottom: 30px;
          font-size: 16px;
        }
        
        .upload-box {
          border: 2px dashed #ddd;
          border-radius: 10px;
          padding: 40px 20px;
          margin: 20px 0;
          background: #f9f9f9;
          transition: all 0.3s ease;
        }
        
        .upload-box:hover {
          border-color: #667eea;
          background: #f0f4ff;
        }
        
        input[type="file"] {
          margin: 20px 0;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
        }
        
        button {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 25px;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s ease;
          margin: 5px;
        }
        
        button:hover {
          transform: translateY(-2px);
        }
        
        .icon {
          font-size: 48px;
          color: #667eea;
          margin-bottom: 15px;
        }
        
        .result {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
        }
        
        .loading {
          background: #fff3cd;
          border: 1px solid #ffeeba;
          color: #856404;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
        }
        
        .spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .nav-btn {
          background: #28a745;
        }
      `}</style>
      
      <div className="container">
        <div>
  <button onClick={() => setCurrentPage('home')}>🏠 Home</button>
  <button className="nav-btn" onClick={() => setCurrentPage('classify')}>🏷️ Classify</button>
  <button onClick={() => setCurrentPage('main')}>🌐 Browse Public Data</button>
  <button onClick={logout} style={{background: '#dc3545'}}>Logout</button>
</div>
        
        <h1>DICOM to NIfTI Converter</h1>
        <p className="subtitle">Upload your DICOM ZIP file for conversion</p>
        
        <div className="upload-box">
          <div className="icon">📁</div>
          <h3>Select ZIP File</h3>
          <input 
            type="file" 
            accept=".zip" 
            onChange={(e) => setFile(e.target.files[0])}
            required 
          />
          <br />
          <button onClick={handleSubmit}>🔄 Convert to NIfTI</button>
        </div>
        
        {showResult && (
          <div dangerouslySetInnerHTML={{ __html: result }} />
        )}
      </div>
    </div>
  );
};

export default HomePage;
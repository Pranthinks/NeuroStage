import React, { useState, useEffect } from 'react';

const ClassifyPage = ({ setCurrentPage, logout }) => {
  const [folders, setFolders] = useState([]);
  const [result, setResult] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [classifyingFolder, setClassifyingFolder] = useState(null);
  const [viewingFolder, setViewingFolder] = useState(null);
  const [classifiedFiles, setClassifiedFiles] = useState(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  
  useEffect(() => { loadFolders(); }, []);
  
  const loadFolders = async () => {
    try {
      const response = await fetch('/get_folders');
      const data = await response.json();
      if (data.status === 'success') setFolders(data.folders);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };
  
  const classifyFolder = async (folderName) => {
    setClassifyingFolder(folderName);
    setResult('');
    setShowResult(false);
    
    try {
      const response = await fetch('/classify_folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_path: folderName })
      });
      
      const data = await response.json();
      
      const message = data.status === 'success' 
        ? `<div class="result">
            <h3>✅ Classification Complete for ${folderName}!</h3>
            <strong>Files organized into:</strong>
            ${data.summary.map(cat => 
              `<div style="padding: 5px 0; border-bottom: 1px solid #e9ecef;">
                📁 <strong>${cat.folder}:</strong> ${cat.count} files
              </div>`).join('')}
          </div>`
        : `<div class="result error"><strong>Classification failed:</strong><br>${data.message}</div>`;
      
      setResult(message);
      setShowResult(true);
      if (data.status === 'success') setTimeout(loadFolders, 2000);
    } catch (error) {
      setResult(`<div class="result error"><strong>Error:</strong><br>${error.message}</div>`);
      setShowResult(true);
    } finally {
      setClassifyingFolder(null);
    }
  };

  const viewClassifiedFiles = async (folderName) => {
    setLoadingFiles(true);
    setViewingFolder(folderName);
    
    try {
      const response = await fetch(`/get_classified_files/${folderName}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setClassifiedFiles(data.classified_files);
      } else {
        alert(`Error: ${data.message}`);
        setViewingFolder(null);
      }
    } catch (error) {
      alert(`Network error: ${error.message}`);
      setViewingFolder(null);
    } finally {
      setLoadingFiles(false);
    }
  };

  const downloadFile = (folderName, classification, filename) => 
    window.open(`/download_file/${folderName}/${classification}/${filename}`, '_blank');

  const downloadClassification = (folderName, classification) => 
    window.open(`/download_classification/${folderName}/${classification}`, '_blank');

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getIcon = (classification) => ({
    'T1_scans': '🧠', 'T2_scans': '🔬', 'Diff_scans': '🌊', 'Pcasl_scans': '💉', 'unclassified': '❓'
  })[classification] || '📄';

  const styles = `
    body { font-family: Arial, sans-serif; max-width: ${viewingFolder ? '1200px' : '800px'}; margin: ${viewingFolder ? '20px' : '50px'} auto; padding: ${viewingFolder ? '20px' : '30px'}; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
    .container { background: white; padding: ${viewingFolder ? '30px' : '40px'}; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: ${viewingFolder ? 'left' : 'center'}; }
    h1 { color: #333; margin-bottom: 10px; font-size: 28px; }
    .subtitle { color: #666; margin-bottom: 30px; font-size: 16px; }
    button { background: linear-gradient(45deg, #667eea, #764ba2); color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 16px; cursor: pointer; transition: transform 0.2s ease; margin: 5px; }
    button:hover { transform: translateY(-2px); }
    .nav-btn { background: #28a745; }
    .back-btn { background: #6c757d; padding: 10px 20px; margin-bottom: 20px; }
    .folders-section { background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: left; }
    .folder-item { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; margin: 10px 0; display: flex; justify-content: space-between; align-items: center; }
    .folder-name { font-weight: bold; color: #333; margin-bottom: 5px; }
    .folder-details { font-size: 14px; color: #666; }
    .folder-actions { display: flex; gap: 10px; }
    .classify-btn, .view-btn { padding: 10px 20px; font-size: 14px; }
    .classify-btn:disabled, .view-btn:disabled { background: #6c757d; cursor: not-allowed; transform: none; }
    .view-btn { background: #17a2b8; }
    .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #f3f3f3; border-top: 2px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .result { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: left; }
    .result.error { background: #f8d7da; color: #721c24; }
    .classified-badge { background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 10px; }
    .classification-section { border: 1px solid #dee2e6; border-radius: 10px; margin: 20px 0; overflow: hidden; }
    .classification-header { background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 15px 20px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
    .download-classification-btn { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 5px 15px; border-radius: 20px; cursor: pointer; font-size: 12px; }
    .download-classification-btn:hover { background: rgba(255,255,255,0.3); }
    .file-list { background: #f8f9fa; }
    .file-item { padding: 15px 20px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; }
    .file-item:hover { background: #e9ecef; }
    .file-info { flex-grow: 1; }
    .file-name { font-weight: bold; color: #333; margin-bottom: 5px; }
    .file-details { font-size: 12px; color: #666; }
    .download-btn { background: #28a745; color: white; border: none; padding: 5px 15px; border-radius: 15px; cursor: pointer; font-size: 12px; margin-left: 5px; }
    .download-btn:hover { background: #218838; }
    .empty-classification { padding: 40px; text-align: center; color: #666; font-style: italic; }
  `;

  // File viewer
  if (viewingFolder && classifiedFiles) {
    return (
      <div>
        <style>{styles}</style>
        <div className="container">
          <button className="back-btn" onClick={() => setViewingFolder(null)}>← Back to Folders</button>
          <h1>📁 Viewing: {viewingFolder}</h1>
          
          {Object.entries(classifiedFiles).map(([classification, files]) => (
            <div key={classification} className="classification-section">
              <div className="classification-header">
                <span>{getIcon(classification)} {classification.replace('_', ' ')} ({files.length} files)</span>
                {files.length > 0 && (
                  <button className="download-classification-btn" onClick={() => downloadClassification(viewingFolder, classification)}>
                    📦 Download All
                  </button>
                )}
              </div>
              
              <div className="file-list">
                {files.length === 0 ? (
                  <div className="empty-classification">No files in this category</div>
                ) : (
                  files.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <div className="file-name">📄 {file.base_name}</div>
                        <div className="file-details">
                          Main: {file.main_file} | Size: {formatFileSize(file.file_size)} | 
                          Files: {file.total_files} | Modified: {new Date(file.modified * 1000).toLocaleDateString()}
                          {file.json_file && ` | Has JSON: ${file.json_file}`}
                        </div>
                      </div>
                      <div>
                        <button className="download-btn" onClick={() => downloadFile(viewingFolder, classification, file.main_file)}>
                          📥 Main
                        </button>
                        {file.json_file && (
                          <button className="download-btn" onClick={() => downloadFile(viewingFolder, classification, file.json_file)}>
                            📄 JSON
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Main folder list
  return (
    <div>
      <style>{styles}</style>
      <div className="container">
        <div>
          <button onClick={() => setCurrentPage('home')}>🏠 Home</button>
          <button className="nav-btn" onClick={() => setCurrentPage('classify')}>🏷️ Classify</button>
          <button onClick={logout} style={{background: '#dc3545'}}>Logout</button>
        </div>
        
        <h1>🏷️ NIfTI File Classifier</h1>
        <p className="subtitle">Organize and view your converted files</p>
        
        <div className="folders-section">
          <h3>📁 Available Folders</h3>
          <button style={{background: 'linear-gradient(45deg, #667eea, #764ba2)', padding: '10px 20px', marginTop: '20px'}} onClick={loadFolders}>🔄 Refresh</button>
          
          {folders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <h3>📂 No converted folders found</h3>
              <p>Convert some DICOM files first!</p>
              <button onClick={() => setCurrentPage('home')}>🔄 Go to Converter</button>
            </div>
          ) : (
            folders.map(folder => (
              <div key={folder.name} className="folder-item">
                <div>
                  <div className="folder-name">
                    📁 {folder.name}
                    {folder.has_classification && <span className="classified-badge">✅ Classified</span>}
                  </div>
                  <div className="folder-details">
                    {folder.file_count} NIfTI files • Created: {new Date(folder.created * 1000).toLocaleString()}
                  </div>
                </div>
                <div className="folder-actions">
                  {folder.has_classification && (
                    <button className="view-btn" onClick={() => viewClassifiedFiles(folder.name)} disabled={loadingFiles}>
                      {loadingFiles && viewingFolder === folder.name ? 
                        <><div className="spinner"></div>Loading...</> : '👁️ View Files'}
                    </button>
                  )}
                  <button className="classify-btn" onClick={() => classifyFolder(folder.name)} disabled={classifyingFolder === folder.name}>
                    {classifyingFolder === folder.name ? 
                      <><div className="spinner"></div>Classifying...</> : 
                      (folder.has_classification ? '🔄 Re-classify' : '🔍 Classify')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {showResult && <div dangerouslySetInnerHTML={{ __html: result }} />}
      </div>
    </div>
  );
};

export default ClassifyPage;
import React, { useState, useEffect } from 'react';

const ClassifyPage = ({ setCurrentPage, logout }) => {
  const [folders, setFolders] = useState([]);
  const [result, setResult] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [classifyingFolder, setClassifyingFolder] = useState(null);
  const [viewingFolder, setViewingFolder] = useState(null);
  const [classifiedFiles, setClassifiedFiles] = useState(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  useEffect(() => { loadFolders(); }, []);

  const getUserName = () => localStorage.getItem('userName') || 'User';
  
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
      
      if (data.status === 'success') {
        setResult(`
          <div class="message success">
            <div class="message-content">
              <div class="message-title">Classification Complete for ${folderName}!</div>
              <div class="message-subtitle">Files organized into:</div>
              <div class="summary-list">
                ${data.summary.map(cat => 
                  `<div class="summary-item">${cat.folder}: ${cat.count} files</div>`
                ).join('')}
              </div>
            </div>
          </div>
        `);
      } else {
        setResult(`
          <div class="message error">
            <div class="message-title">Classification Failed</div>
            <div class="message-subtitle">${data.message}</div>
          </div>
        `);
      }
      
      setShowResult(true);
      if (data.status === 'success') setTimeout(loadFolders, 2000);
    } catch (error) {
      setResult(`
        <div class="message error">
          <div class="message-title">Network Error</div>
          <div class="message-subtitle">${error.message}</div>
        </div>
      `);
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
    if (!bytes) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getClassificationDisplay = (classification) => {
    const config = {
      'T1_scans': { name: 'T1 SCANS', color: 'blue' },
      'T2_scans': { name: 'T2 SCANS', color: 'green' },
      'Diff_scans': { name: 'DIFFUSION', color: 'purple' },
      'Bold_scans': { name: 'BOLD SCANS', color: 'orange' },
      'Pcasl_scans': { name: 'PCASL', color: 'red' },
      'unclassified': { name: 'UNCLASSIFIED', color: 'gray' }
    };
    return config[classification] || config['unclassified'];
  };

  const styles = `
    .container { min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%); font-family: system-ui, -apple-system, sans-serif; }
    .navbar { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(229, 231, 235, 0.5); position: sticky; top: 0; z-index: 50; }
    .nav-content { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; justify-content: space-between; align-items: center; height: 64px; }
    .logo { font-size: 1.5rem; font-weight: bold; color: #1e3a8a; }
    .nav-buttons { display: flex; align-items: center; gap: 1rem; }
    .nav-links { display: none; gap: 0.25rem; align-items: center; }
    @media (min-width: 768px) { .nav-links { display: flex; } }
    .nav-link { padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; background: none; }
    .nav-link.active { color: #2563eb; background: #eff6ff; }
    .nav-link:not(.active) { color: #6b7280; }
    .nav-link:not(.active):hover { color: #2563eb; background: #f9fafb; }
    .back-btn { display: flex; align-items: center; gap: 0.5rem; color: #6b7280; background: none; border: none; cursor: pointer; transition: color 0.2s; }
    .back-btn:hover { color: #2563eb; }
    .profile-container { position: relative; }
    .profile-btn { display: flex; align-items: center; gap: 0.5rem; background: #2563eb; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; transition: background 0.2s; }
    .profile-btn:hover { background: #1d4ed8; }
    .avatar { width: 32px; height: 32px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 600; }
    .profile-menu { position: absolute; top: 100%; right: 0; background: white; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15); border: 1px solid #e2e8f0; min-width: 200px; margin-top: 8px; padding: 8px; z-index: 100; }
    .menu-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 12px; border: none; background: none; text-align: left; cursor: pointer; font-size: 14px; color: #374151; transition: all 0.2s; border-radius: 8px; font-weight: 500; }
    .menu-item:hover { background: #f8fafc; }
    .menu-item.active { color: #2563eb; background: #eff6ff; }
    .menu-item.logout { color: #dc2626; }
    .menu-item.logout:hover { background: #fef2f2; }
    .menu-divider { height: 1px; background: #e5e7eb; margin: 8px 0; }
    .sm-hidden { display: block; }
    @media (min-width: 640px) { .sm-hidden { display: none; } }
    .mobile-only { display: block; }
    @media (min-width: 768px) { .mobile-only { display: none; } }
    .main-content { max-width: 1200px; margin: 0 auto; padding: 3rem 1rem; }
    .header { text-align: center; margin-bottom: 3rem; }
    .header h1 { font-size: 2.5rem; font-weight: bold; color: #111827; margin-bottom: 1rem; }
    .header p { font-size: 1.25rem; color: #6b7280; }
    .card { background: white; border-radius: 1rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
    .card-header { padding: 2rem; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .card-title { font-size: 1.5rem; font-weight: bold; color: #111827; }
    .btn { display: flex; align-items: center; gap: 0.5rem; border: none; padding: 0.75rem 1rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-success { background: #10b981; color: white; }
    .btn-success:hover { background: #059669; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top: 2px solid #ffffff; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .card-content { padding: 2rem; }
    .empty-state { text-align: center; padding: 3rem 0; }
    .empty-icon { width: 64px; height: 64px; color: #d1d5db; margin: 0 auto 1rem; }
    .folder-list { display: flex; flex-direction: column; gap: 1rem; }
    .folder-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem; transition: all 0.3s; }
    .folder-item:hover { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-color: #c7d2fe; }
    .folder-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .folder-info { flex: 1; }
    .folder-name { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .folder-title { font-size: 1.125rem; font-weight: 600; color: #111827; }
    .classified-badge { background: #dcfce7; color: #166534; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .folder-meta { font-size: 0.875rem; color: #6b7280; }
    .folder-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .message { padding: 1rem; border-radius: 0.5rem; margin-top: 2rem; }
    .message.success { background: #ecfdf5; border: 1px solid #bbf7d0; color: #065f46; }
    .message.error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    .message-title { font-weight: 600; margin-bottom: 0.5rem; }
    .message-subtitle { font-size: 0.875rem; margin-bottom: 0.75rem; }
    .summary-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .summary-item { padding: 0.5rem; background: rgba(255, 255, 255, 0.3); border-radius: 0.375rem; font-weight: 500; }
    .classification-section { margin-bottom: 1.5rem; border-radius: 1rem; overflow: hidden; }
    .classification-header { padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
    .classification-header.blue { background: #eff6ff; color: #1e40af; border-left: 4px solid #3b82f6; }
    .classification-header.green { background: #f0fdf4; color: #065f46; border-left: 4px solid #10b981; }
    .classification-header.purple { background: #faf5ff; color: #6b21a8; border-left: 4px solid #8b5cf6; }
    .classification-header.orange { background: #fff7ed; color: #c2410c; border-left: 4px solid #fb923c; }
    .classification-header.red { background: #fef2f2; color: #991b1b; border-left: 4px solid #ef4444; }
    .classification-header.gray { background: #f9fafb; color: #374151; border-left: 4px solid #6b7280; }
    .classification-info { display: flex; align-items: center; gap: 0.75rem; }
    .classification-icon { font-size: 1.5rem; }
    .classification-name { font-size: 1.125rem; font-weight: 600; }
    .classification-count { font-size: 0.875rem; opacity: 0.8; }
    .download-all-btn { background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3); color: inherit; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; transition: background 0.2s; }
    .download-all-btn:hover { background: rgba(255, 255, 255, 0.3); }
    .file-list { background: white; }
    .file-item { padding: 1rem 1.5rem; border-bottom: 1px solid #f3f4f6; transition: background 0.2s; }
    .file-item:hover { background: #f9fafb; }
    .file-item:last-child { border-bottom: none; }
    .file-content { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .file-info { flex: 1; }
    .file-name { font-weight: 500; color: #111827; margin-bottom: 0.5rem; }
    .file-meta { font-size: 0.875rem; color: #6b7280; }
    .file-actions { display: flex; gap: 0.5rem; }
    .download-btn { padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background 0.2s; border: none; }
    .download-main { background: #2563eb; color: white; }
    .download-main:hover { background: #1d4ed8; }
    .download-json { background: #10b981; color: white; }
    .download-json:hover { background: #059669; }
  `;

  const Icon = ({ d }) => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );

  // File viewer
  if (viewingFolder && classifiedFiles) {
    return (
      <div className="container">
        <style>{styles}</style>
        
        <nav className="navbar">
          <div className="nav-content">
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <button className="back-btn" onClick={() => setViewingFolder(null)}>
                <Icon d="M15 19l-7-7 7-7" />
                Back to Folders
              </button>
              <div className="logo">MedScan Pro</div>
            </div>
            
            <div className="profile-container">
              <button className="profile-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="avatar">{getUserName().charAt(0).toUpperCase()}</div>
                <span className="sm-hidden">{getUserName()}</span>
                <Icon d="M19 9l-7 7-7-7" />
              </button>
              {showProfileMenu && (
                <div className="profile-menu">
                  <button className="menu-item" onClick={() => { setCurrentPage('home'); setShowProfileMenu(false); }}>
                    <Icon d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    My Dashboard
                  </button>
                  <button className="menu-item active" onClick={() => { setCurrentPage('classify'); setShowProfileMenu(false); }}>
                    <Icon d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    Classify Files
                  </button>
                  <div className="menu-divider" />
                  <button className="menu-item logout" onClick={() => { logout(); setShowProfileMenu(false); }}>
                    <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="main-content">
          <div className="header">
            <h1>Viewing: {viewingFolder}</h1>
          </div>
          
          {Object.entries(classifiedFiles).map(([classification, files]) => {
            const display = getClassificationDisplay(classification);
            return (
              <div key={classification} className="classification-section">
                <div className="card">
                  <div className={`classification-header ${display.color}`}>
                    <div className="classification-info">
                      <span className="classification-icon">{display.icon}</span>
                      <div>
                        <div className="classification-name">{display.name}</div>
                        <div className="classification-count">{files.length} files</div>
                      </div>
                    </div>
                    {files.length > 0 && (
                      <button className="download-all-btn" onClick={() => downloadClassification(viewingFolder, classification)}>
                        Download All
                      </button>
                    )}
                  </div>
                  
                  <div className="file-list">
                    {files.length === 0 ? (
                      <div className="empty-state">
                        <p>No files in this category</p>
                      </div>
                    ) : (
                      files.map((file, index) => (
                        <div key={index} className="file-item">
                          <div className="file-content">
                            <div className="file-info">
                              <div className="file-name">{file.base_name}</div>
                              <div className="file-meta">
                                Size: {formatFileSize(file.file_size)} • Files: {file.total_files} • Modified: {new Date(file.modified * 1000).toLocaleDateString()}
                                {file.json_file && ' • Has JSON'}
                              </div>
                            </div>
                            <div className="file-actions">
                              <button className="download-btn download-main" onClick={() => downloadFile(viewingFolder, classification, file.main_file)}>
                                Main
                              </button>
                              {file.json_file && (
                                <button className="download-btn download-json" onClick={() => downloadFile(viewingFolder, classification, file.json_file)}>
                                  JSON
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Main page
  return (
    <div className="container">
      <style>{styles}</style>
      
      <nav className="navbar">
        <div className="nav-content">
          <div className="logo">MedScan Pro</div>
          
          <div className="nav-buttons">
            <div className="nav-links">
              <button className="nav-link" onClick={() => setCurrentPage('home')}>Dashboard</button>
              <button className="nav-link active" onClick={() => setCurrentPage('classify')}>Classify</button>
              <button className="nav-link" onClick={() => setCurrentPage('main')}>Browse Data</button>
            </div>
            
            <div className="profile-container">
              <button className="profile-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="avatar">{getUserName().charAt(0).toUpperCase()}</div>
                <span className="sm-hidden">{getUserName()}</span>
                <Icon d="M19 9l-7 7-7-7" />
              </button>
              {showProfileMenu && (
                <div className="profile-menu">
                  <button className="menu-item" onClick={() => { setCurrentPage('home'); setShowProfileMenu(false); }}>
                    <Icon d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    My Dashboard
                  </button>
                  <button className="menu-item active" onClick={() => { setCurrentPage('classify'); setShowProfileMenu(false); }}>
                    <Icon d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    Classify Files
                  </button>
                  <button className="menu-item mobile-only" onClick={() => { setCurrentPage('main'); setShowProfileMenu(false); }}>
                    <Icon d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    Browse Public Data
                  </button>
                  <div className="menu-divider" />
                  <button className="menu-item logout" onClick={() => { logout(); setShowProfileMenu(false); }}>
                    <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <div className="header">
          <h1>NIfTI File Classifier</h1>
          <p>Organize and view your converted medical imaging files</p>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Available Folders</h2>
            <button className="btn btn-primary" onClick={loadFolders}>
              <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              Refresh
            </button>
          </div>
          
          <div className="card-content">
            {folders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <h3>No converted folders found</h3>
                <p>Convert some DICOM files first to get started</p>
                <button className="btn btn-primary" onClick={() => setCurrentPage('home')}>
                  Go to Converter
                </button>
              </div>
            ) : (
              <div className="folder-list">
                {folders.map(folder => (
                  <div key={folder.name} className="folder-item">
                    <div className="folder-header">
                      <div className="folder-info">
                        <div className="folder-name">
                          <span className="folder-title">{folder.name}</span>
                          {folder.has_classification && (
                            <span className="classified-badge">Classified</span>
                          )}
                        </div>
                        <div className="folder-meta">
                          {folder.file_count} NIfTI files • Created: {new Date(folder.created * 1000).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="folder-actions">
                        {folder.has_classification && (
                          <button 
                            className="btn btn-success" 
                            onClick={() => viewClassifiedFiles(folder.name)} 
                            disabled={loadingFiles && viewingFolder === folder.name}
                          >
                            {loadingFiles && viewingFolder === folder.name ? (
                              <div className="spinner"></div>
                            ) : (
                              <Icon d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            )}
                            View Files
                          </button>
                        )}
                        <button 
                          className="btn btn-primary" 
                          onClick={() => classifyFolder(folder.name)} 
                          disabled={classifyingFolder === folder.name}
                        >
                          {classifyingFolder === folder.name ? (
                            <div className="spinner"></div>
                          ) : (
                            <Icon d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          )}
                          {classifyingFolder === folder.name 
                            ? 'Classifying...' 
                            : folder.has_classification 
                              ? 'Re-classify' 
                              : 'Classify'
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {showResult && (
          <div dangerouslySetInnerHTML={{ __html: result }} />
        )}
      </div>
    </div>
  );
};

export default ClassifyPage;
//New redesigned homepage.jsx
import React, { useState } from 'react';

const HomePage = ({ setCurrentPage, logout }) => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getUserName = () => localStorage.getItem('userName') || 'User';

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setShowResult(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a file first!');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    setIsUploading(true);
    setShowResult(true);
    setResult(`
      <div class="message loading">
        <div class="spinner"></div>
        <div>
          <div class="message-title">Processing your DICOM files...</div>
          <div class="message-subtitle">This may take a few moments</div>
        </div>
      </div>
    `);
    
    try {
      const response = await fetch('/upload', { method: 'POST', body: formData });
      const data = await response.json();
      
      if (data.status === 'success') {
        setResult(`
          <div class="message success">
            <svg class="message-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <div class="message-title">Conversion Completed Successfully!</div>
              <div class="message-subtitle">Files saved in: <code>${data.folder_path}</code></div>
              <div class="message-note">You can find your converted NIfTI files in the output subfolder</div>
            </div>
          </div>
        `);
      } else {
        setResult(`
          <div class="message error">
            <svg class="message-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <div class="message-title">Conversion Failed</div>
              <div class="message-subtitle">${data.message}</div>
            </div>
          </div>
        `);
      }
    } catch (error) {
      setResult(`
        <div class="message error">
          <svg class="message-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <div class="message-title">Network Error</div>
            <div class="message-subtitle">${error.message}</div>
          </div>
        </div>
      `);
    } finally {
      setIsUploading(false);
    }
  };

  const baseStyles = `
    .container { min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%); font-family: system-ui, -apple-system, sans-serif; }
    .navbar { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(229, 231, 235, 0.5); position: sticky; top: 0; z-index: 50; }
    .nav-content { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; justify-content: space-between; align-items: center; height: 64px; }
    .logo { font-size: 1.5rem; font-weight: bold; color: #1e3a8a; }
    .nav-buttons { display: flex; align-items: center; gap: 1rem; }
    .nav-links { display: none; gap: 0.25rem; align-items: center; }
    @media (min-width: 768px) { .nav-links { display: flex; } }
    .nav-link { padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .nav-link.active { color: #2563eb; background: #eff6ff; }
    .nav-link:not(.active) { color: #6b7280; }
    .nav-link:not(.active):hover { color: #2563eb; background: #f9fafb; }
    .profile-container { position: relative; }
    .profile-btn { display: flex; align-items: center; gap: 0.5rem; background: #2563eb; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; transition: background 0.2s; }
    .profile-btn:hover { background: #1d4ed8; }
    .avatar { width: 32px; height: 32px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 600; }
    .profile-menu { position: absolute; top: 100%; right: 0; background: white; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; min-width: 200px; margin-top: 8px; padding: 8px; z-index: 100; }
    .menu-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 12px; border: none; background: none; text-align: left; cursor: pointer; font-size: 14px; color: #374151; transition: all 0.2s ease; border-radius: 8px; font-weight: 500; }
    .menu-item:hover { background: #f8fafc; color: #1f2937; }
    .menu-item.active { color: #2563eb; background: #eff6ff; }
    .menu-item.logout { color: #dc2626; }
    .menu-item.logout:hover { background: #fef2f2; color: #b91c1c; }
    .menu-item svg { width: 16px; height: 16px; }
    .menu-divider { height: 1px; background: #e5e7eb; margin: 8px 0; }
    .mobile-only { display: block; }
    @media (min-width: 768px) { .mobile-only { display: none; } }
    .main-content { max-width: 1024px; margin: 0 auto; padding: 3rem 1rem; }
    @media (min-width: 640px) { .main-content { padding: 3rem 1.5rem; } }
    @media (min-width: 1024px) { .main-content { padding: 3rem 2rem; } }
    .header { text-align: center; margin-bottom: 3rem; }
    .header h1 { font-size: 2.5rem; font-weight: bold; color: #111827; margin-bottom: 1rem; }
    @media (min-width: 640px) { .header h1 { font-size: 3rem; } }
    .header p { font-size: 1.25rem; color: #6b7280; }
    .upload-card { background: white; border-radius: 1rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; overflow: hidden; }
    .upload-content { padding: 2rem; }
    .upload-section { margin-bottom: 2rem; }
    .upload-label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 1rem; }
    .upload-area { position: relative; border: 2px dashed #d1d5db; border-radius: 0.75rem; padding: 2rem; text-align: center; transition: all 0.3s; }
    .upload-area.has-file { border-color: #10b981; background: #ecfdf5; }
    .upload-area:hover:not(.has-file) { border-color: #3b82f6; background: #eff6ff; }
    .upload-input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
    .upload-content-inner { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .upload-icon { width: 48px; height: 48px; color: #9ca3af; }
    .upload-icon.success { color: #10b981; }
    .upload-title { font-size: 1.125rem; font-weight: 500; margin-bottom: 0.5rem; }
    .upload-title.success { color: #065f46; }
    .upload-description { color: #6b7280; }
    .file-size { font-size: 0.875rem; color: #059669; }
    .convert-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 2rem; border-radius: 0.5rem; font-weight: 500; color: white; border: none; cursor: pointer; transition: all 0.2s; }
    .convert-btn:enabled { background: #2563eb; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3); }
    .convert-btn:enabled:hover { background: #1d4ed8; box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.4); transform: translateY(-1px); }
    .convert-btn:disabled { background: #9ca3af; cursor: not-allowed; }
    .result-section { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; }
    .message { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem; border-radius: 0.5rem; border-width: 1px; }
    .message.loading { background: #eff6ff; border-color: #bfdbfe; color: #1e3a8a; }
    .message.success { background: #ecfdf5; border-color: #bbf7d0; color: #065f46; }
    .message.error { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
    .message-icon { width: 20px; height: 20px; flex-shrink: 0; margin-top: 2px; }
    .message-title { font-weight: 500; }
    .message-subtitle { font-size: 0.875rem; margin-top: 0.25rem; opacity: 0.9; }
    .message-note { font-size: 0.75rem; margin-top: 0.5rem; opacity: 0.8; }
    .message code { background: rgba(255, 255, 255, 0.5); padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: ui-monospace, monospace; font-size: 0.75rem; }
    .spinner { display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(59, 130, 246, 0.3); border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; flex-shrink: 0; margin-top: 2px; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .info-cards { display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-top: 3rem; }
    @media (min-width: 768px) { .info-cards { grid-template-columns: 1fr 1fr; } }
    .info-card { background: white; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
    .info-card-content { display: flex; align-items: flex-start; gap: 1rem; }
    .info-icon { width: 40px; height: 40px; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .info-icon svg { width: 20px; height: 20px; }
    .info-title { font-weight: 600; color: #111827; margin-bottom: 0.5rem; }
    .info-text { color: #6b7280; font-size: 0.875rem; line-height: 1.5; }
    .sm-hidden { display: block; }
    @media (min-width: 640px) { .sm-hidden { display: none; } .sm-block { display: block; } }
  `;

  const Icon = ({ d, className = "" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );

  return (
    <div className="container">
      <style>{baseStyles}</style>
      
      <nav className="navbar">
        <div className="nav-content">
          <div className="logo">MedScan Pro</div>
          
          <div className="nav-buttons">
            <div className="nav-links">
              <button className="nav-link active" onClick={() => setCurrentPage('home')}>Dashboard</button>
              <button className="nav-link" onClick={() => setCurrentPage('classify')}>Classify</button>
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
                  <button className="menu-item active" onClick={() => { setCurrentPage('home'); setShowProfileMenu(false); }}>
                    <Icon d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <span>My Dashboard</span>
                  </button>
                  <button className="menu-item" onClick={() => { setCurrentPage('classify'); setShowProfileMenu(false); }}>
                    <Icon d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    <span>Classify Files</span>
                  </button>
                  <button className="menu-item mobile-only" onClick={() => { setCurrentPage('main'); setShowProfileMenu(false); }}>
                    <Icon d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    <span>Browse Public Data</span>
                  </button>
                  <div className="menu-divider" />
                  <button className="menu-item logout" onClick={() => { logout(); setShowProfileMenu(false); }}>
                    <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <div className="header">
          <h1>DICOM to NIfTI Converter</h1>
          <p>Upload your DICOM ZIP file for professional medical image conversion</p>
        </div>

        <div className="upload-card">
          <div className="upload-content">
            <div>
              <div className="upload-section">
                <label className="upload-label">Select DICOM ZIP File</label>
                <div className={`upload-area ${file ? 'has-file' : ''}`}>
                  <input type="file" accept=".zip" onChange={handleFileChange} className="upload-input" required />
                  <div className="upload-content-inner">
                    {file ? (
                      <>
                        <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="upload-icon success" />
                        <div>
                          <h3 className="upload-title success">{file.name}</h3>
                          <p className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" className="upload-icon" />
                        <div>
                          <h3 className="upload-title">Drop your ZIP file here</h3>
                          <p className="upload-description">Or click to browse and select your DICOM ZIP file</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{textAlign: 'center'}}>
                <button onClick={handleSubmit} disabled={!file || isUploading} className="convert-btn">
                  {isUploading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Converting...</span>
                    </>
                  ) : (
                    <>
                      <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      <span>Convert to NIfTI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {showResult && (
              <div className="result-section">
                <div dangerouslySetInnerHTML={{ __html: result }} />
              </div>
            )}
          </div>
        </div>

        <div className="info-cards">
          <div className="info-card">
            <div className="info-card-content">
              <div className="info-icon" style={{background: '#eff6ff'}}>
                <Icon d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" style={{color: '#2563eb'}} />
              </div>
              <div>
                <h3 className="info-title">Supported Format</h3>
                <p className="info-text">Upload ZIP files containing DICOM images. Our system supports all standard DICOM formats and automatically handles batch conversions.</p>
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-content">
              <div className="info-icon" style={{background: '#ecfdf5'}}>
                <Icon d="M9 12l2 2 4-4m5.018-4.082a2.12 2.12 0 00-.637-.82 2.108 2.108 0 00-.808-.332 2.15 2.15 0 00-.895 0 2.108 2.108 0 00-.808.332 2.12 2.12 0 00-.637.82l-6.83 6.83a2.12 2.12 0 00-.332.808 2.15 2.15 0 000 .895c.08.305.191.593.332.808l.82.637c.215.141.452.25.695.332a2.15 2.15 0 00.895 0c.305-.08.593-.191.808-.332.26-.172.49-.382.67-.615l6.83-6.83z" style={{color: '#10b981'}} />
              </div>
              <div>
                <h3 className="info-title">Next Step</h3>
                <p className="info-text">After conversion, use the Classify feature to automatically organize your NIfTI files by scan type using AI-powered classification.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
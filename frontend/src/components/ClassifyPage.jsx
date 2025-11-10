import React, { useState, useEffect } from 'react';
import NiftiViewer from './NiftiViewer';

const ClassifyPage = ({ setCurrentPage }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [classifiedFiles, setClassifiedFiles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mriqcStatus, setMriqcStatus] = useState(null);
  const [processingMriqc, setProcessingMriqc] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      fetchClassifiedFiles(selectedFolder);
      fetchMriqcStatus(selectedFolder);
      
      const interval = setInterval(() => {
        fetchMriqcStatus(selectedFolder);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [selectedFolder]);

  const fetchFolders = async () => {
    try {
      const response = await fetch('/get_folders');
      const data = await response.json();
      if (data.status === 'success') {
        setFolders(data.folders);
        if (data.folders.length > 0) {
          setSelectedFolder(data.folders[0].name);
        }
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassifiedFiles = async (folderName) => {
    try {
      const response = await fetch(`/get_classified_files/${folderName}`);
      const data = await response.json();
      if (data.status === 'success') {
        setClassifiedFiles(data.classified_files);
      }
    } catch (error) {
      console.error('Error fetching classified files:', error);
    }
  };

  const fetchMriqcStatus = async (folderName) => {
    try {
      const response = await fetch(`/api/mriqc_status/${folderName}`);
      const data = await response.json();
      setMriqcStatus(data);
    } catch (error) {
      console.error('Error fetching MRIQC status:', error);
    }
  };

  const runMriqc = async () => {
    if (!selectedFolder) return;
    
    setProcessingMriqc(true);
    
    try {
      const response = await fetch('/api/run_mriqc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folder_name: selectedFolder,
          subject_id: '01'
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        alert('MRIQC quality control started! This will take 30-60 minutes. The page will update automatically when complete.');
        setMriqcStatus({ status: 'running', reports: [] });
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error running MRIQC:', error);
      alert('Failed to start MRIQC processing');
    } finally {
      setProcessingMriqc(false);
    }
  };

  const viewMriqcReport = (report) => {
    window.open(report.path, '_blank');
  };

  const viewFile = (classification, filename) => {
    const fileUrl = `/view_file/${selectedFolder}/${classification}/${filename}`;
    setViewerFile({
      url: fileUrl,
      name: filename
    });
  };

  const closeViewer = () => {
    setViewerFile(null);
  };

  const getMriqcStatusBadge = (status) => {
    const badges = {
      'not_started': { text: 'Quality Control Not Started', color: '#6b7280', bg: '#f3f4f6', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      'running': { text: 'Quality Control Running...', color: '#f59e0b', bg: '#fef3c7', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
      'completed': { text: 'Quality Control Complete', color: '#10b981', bg: '#d1fae5', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
    };
    return badges[status] || badges['not_started'];
  };

  const getClassificationLabel = (key) => {
    const labels = {
      'anat': 'Anatomical (T1w/T2w)',
      'func': 'Functional (BOLD)',
      'dwi': 'Diffusion (DWI)',
      'perf': 'Perfusion (ASL)',
      'unclassified': 'Unclassified'
    };
    return labels[key] || key;
  };

  const getClassificationColor = (key) => {
    const colors = {
      'anat': '#3b82f6',
      'func': '#fb923c',
      'dwi': '#8b5cf6',
      'perf': '#ef4444',
      'unclassified': '#6b7280'
    };
    return colors[key] || '#6b7280';
  };

  const downloadFile = (classification, filename) => {
    window.location.href = `/download_file/${selectedFolder}/${classification}/${filename}`;
  };

  const downloadClassification = (classification) => {
    window.location.href = `/download_classification/${selectedFolder}/${classification}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const styles = `
    .classify-container { min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%); font-family: system-ui, -apple-system, sans-serif; padding: 2rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header h1 { font-size: 2rem; font-weight: bold; color: #111827; }
    .back-btn { background: #6b7280; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; transition: background 0.2s; }
    .back-btn:hover { background: #4b5563; }
    .content-grid { display: grid; grid-template-columns: 300px 1fr; gap: 2rem; }
    .sidebar { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); height: fit-content; }
    .sidebar h2 { font-size: 1.25rem; font-weight: 600; color: #111827; margin-bottom: 1rem; }
    .folder-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .folder-item { padding: 0.75rem; border-radius: 0.5rem; cursor: pointer; transition: background 0.2s; border: 1px solid transparent; }
    .folder-item:hover { background: #f9fafb; }
    .folder-item.active { background: #eff6ff; border-color: #3b82f6; }
    .folder-name { font-weight: 500; color: #111827; margin-bottom: 0.25rem; }
    .folder-meta { font-size: 0.875rem; color: #6b7280; }
    .main-content { display: flex; flex-direction: column; gap: 1.5rem; }
    .mriqc-card { background: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
    .mriqc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .mriqc-title { font-size: 1.5rem; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 0.5rem; }
    .mriqc-status-section { display: flex; gap: 1.5rem; align-items: flex-start; }
    .status-badge { flex: 1; display: flex; align-items: center; gap: 1rem; padding: 1.5rem; border-radius: 0.75rem; }
    .status-icon { width: 48px; height: 48px; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
    .status-info h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.25rem; }
    .status-info p { font-size: 0.875rem; opacity: 0.8; }
    .mriqc-action { flex: 0 0 auto; }
    .mriqc-btn { background: #10b981; color: white; border: none; padding: 1rem 1.5rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; gap: 0.5rem; white-space: nowrap; }
    .mriqc-btn:hover { background: #059669; }
    .mriqc-btn:disabled { background: #9ca3af; cursor: not-allowed; }
    .spinner { display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .processing-info { flex: 1; text-align: center; padding: 2rem; }
    .processing-spinner { width: 48px; height: 48px; border: 4px solid #f3f4f6; border-top: 4px solid #f59e0b; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    .processing-text { color: #6b7280; font-size: 0.875rem; }
    .processing-estimate { color: #9ca3af; font-size: 0.75rem; margin-top: 0.5rem; }
    .reports-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; }
    .reports-title { font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 1rem; }
    .reports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
    .report-card { background: #f9fafb; border-radius: 0.5rem; padding: 1rem; cursor: pointer; transition: all 0.2s; border: 1px solid #e5e7eb; }
    .report-card:hover { background: #f3f4f6; border-color: #3b82f6; }
    .report-name { font-weight: 500; color: #111827; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem; }
    .report-type { font-size: 0.75rem; color: #6b7280; }
    .classification-card { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
    .classification-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .classification-title { font-size: 1.25rem; font-weight: 600; color: #111827; }
    .download-btn { background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: background 0.2s; }
    .download-btn:hover { background: #2563eb; }
    .file-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .file-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f9fafb; border-radius: 0.5rem; }
    .file-info { flex: 1; }
    .file-name { font-weight: 500; color: #111827; margin-bottom: 0.25rem; }
    .file-meta { font-size: 0.75rem; color: #6b7280; }
    .file-actions { display: flex; gap: 0.5rem; }
    .file-view-btn { background: #10b981; color: white; border: none; padding: 0.375rem 0.75rem; border-radius: 0.375rem; cursor: pointer; font-size: 0.75rem; transition: background 0.2s; }
    .file-view-btn:hover { background: #059669; }
    .file-download-btn { background: #6b7280; color: white; border: none; padding: 0.375rem 0.75rem; border-radius: 0.375rem; cursor: pointer; font-size: 0.75rem; transition: background 0.2s; }
    .file-download-btn:hover { background: #4b5563; }
    .empty-state { text-align: center; padding: 3rem; color: #6b7280; }
    .loading-state { text-align: center; padding: 3rem; }
  `;

  if (loading) {
    return (
      <div className="classify-container">
        <style>{styles}</style>
        <div className="loading-state">
          <div className="processing-spinner"></div>
          <p>Loading datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="classify-container">
      <style>{styles}</style>
      
      {viewerFile && (
        <NiftiViewer 
          fileUrl={viewerFile.url}
          fileName={viewerFile.name}
          onClose={closeViewer}
        />
      )}
      
      <div className="header">
        <h1>Dataset Classification & Quality Control</h1>
        <button className="back-btn" onClick={() => setCurrentPage('home')}>
          ← Back to Home
        </button>
      </div>

      {folders.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{margin: '0 auto 1rem'}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m7-8v2m0 0V5h2m-2 2h2" />
          </svg>
          <h3 style={{fontSize: '1.125rem', fontWeight: '500', color: '#111827', marginBottom: '0.5rem'}}>No datasets found</h3>
          <p>Upload DICOM files to get started</p>
        </div>
      ) : (
        <div className="content-grid">
          <div className="sidebar">
            <h2>Your Datasets</h2>
            <div className="folder-list">
              {folders.map(folder => (
                <div 
                  key={folder.name}
                  className={`folder-item ${selectedFolder === folder.name ? 'active' : ''}`}
                  onClick={() => setSelectedFolder(folder.name)}
                >
                  <div className="folder-name">{folder.name}</div>
                  <div className="folder-meta">
                    {folder.file_count} files • {new Date(folder.created * 1000).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="main-content">
            {/* MRIQC Quality Control Section */}
            <div className="mriqc-card">
              <div className="mriqc-header">
                <div className="mriqc-title">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  MRIQC Quality Control
                </div>
              </div>

              {mriqcStatus && (
                <>
                  <div className="mriqc-status-section">
                    {mriqcStatus.status !== 'running' && (
                      <>
                        <div className="status-badge" style={{
                          background: getMriqcStatusBadge(mriqcStatus.status).bg,
                          color: getMriqcStatusBadge(mriqcStatus.status).color
                        }}>
                          <div className="status-icon" style={{
                            background: getMriqcStatusBadge(mriqcStatus.status).color + '33'
                          }}>
                            <svg width="24" height="24" fill="none" stroke={getMriqcStatusBadge(mriqcStatus.status).color} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getMriqcStatusBadge(mriqcStatus.status).icon} />
                            </svg>
                          </div>
                          <div className="status-info">
                            <h3>{getMriqcStatusBadge(mriqcStatus.status).text}</h3>
                            <p>
                              {mriqcStatus.status === 'not_started' && 'Run quality control to assess image quality'}
                              {mriqcStatus.status === 'completed' && `${mriqcStatus.reports.length} report(s) available`}
                            </p>
                          </div>
                        </div>
                        
                        {mriqcStatus.status === 'not_started' && (
                          <div className="mriqc-action">
                            <button 
                              className="mriqc-btn"
                              onClick={runMriqc}
                              disabled={processingMriqc}
                            >
                              {processingMriqc ? (
                                <>
                                  <div className="spinner"></div>
                                  Starting...
                                </>
                              ) : (
                                <>
                                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Run Quality Control
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    
                    {mriqcStatus.status === 'running' && (
                      <div className="processing-info">
                        <div className="processing-spinner"></div>
                        <div className="processing-text">Processing quality metrics...</div>
                        <div className="processing-estimate">Estimated time: 30-60 minutes</div>
                        <p style={{fontSize: '0.75rem', color: '#9ca3af', marginTop: '1rem'}}>
                          The page will automatically update when complete
                        </p>
                      </div>
                    )}
                  </div>

                  {mriqcStatus.status === 'completed' && mriqcStatus.reports.length > 0 && (
                    <div className="reports-section">
                      <div className="reports-title">Quality Reports</div>
                      <div className="reports-grid">
                        {mriqcStatus.reports.map((report, idx) => (
                          <div 
                            key={idx}
                            className="report-card"
                            onClick={() => viewMriqcReport(report)}
                          >
                            <div className="report-name">
                              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {report.name}
                            </div>
                            <div className="report-type">Click to view report</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Classification Files Section */}
            {classifiedFiles && Object.entries(classifiedFiles).map(([classification, files]) => (
              files.length > 0 && (
                <div key={classification} className="classification-card">
                  <div className="classification-header">
                    <div className="classification-title" style={{color: getClassificationColor(classification)}}>
                      {getClassificationLabel(classification)} ({files.length})
                    </div>
                    <button 
                      className="download-btn"
                      onClick={() => downloadClassification(classification)}
                    >
                      Download All
                    </button>
                  </div>
                  
                  <div className="file-list">
                    {files.map((file, idx) => (
                      <div key={idx} className="file-item">
                        <div className="file-info">
                          <div className="file-name">{file.main_file}</div>
                          <div className="file-meta">
                            {formatFileSize(file.file_size)}
                            {file.json_file && ' • JSON metadata included'}
                          </div>
                        </div>
                        <div className="file-actions">
                          {(file.main_file.endsWith('.nii') || file.main_file.endsWith('.nii.gz')) && (
                            <button 
                              className="file-view-btn"
                              onClick={() => viewFile(classification, file.main_file)}
                            >
                              👁️ View
                            </button>
                          )}
                          <button 
                            className="file-download-btn"
                            onClick={() => downloadFile(classification, file.main_file)}
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassifyPage;
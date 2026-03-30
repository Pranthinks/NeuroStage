import React, { useState, useEffect, useRef } from 'react';
import NiftiViewer from './NiftiViewer.jsx';
import ClassificationCard from './ClassificationCard.jsx';
import MriqcConfirmationDialog from './MriqcConfirmationDialog.jsx';
import { getClassificationLabel, getClassificationColor, styles } from './classifyUtils.jsx';

const ClassifyPage = ({ setCurrentPage }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [classifiedFiles, setClassifiedFiles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mriqcStatuses, setMriqcStatuses] = useState({});
  const [processingMriqc, setProcessingMriqc] = useState({});
  const [viewerFile, setViewerFile] = useState(null);
  const [confirmationDialog, setConfirmationDialog] = useState({ 
    isOpen: false, 
    classification: null 
  });
  
  // Track previous MRIQC statuses to detect completion
  const prevMriqcStatusesRef = useRef({});

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

  // Watch for MRIQC completion
  useEffect(() => {
    const prevStatuses = prevMriqcStatusesRef.current;
    
    // Check each classification for status change
    Object.keys(mriqcStatuses).forEach(classification => {
      const currentStatus = mriqcStatuses[classification]?.status;
      const previousStatus = prevStatuses[classification]?.status;
      
      // If status changed from 'running' to 'completed', show dialog
      if (previousStatus === 'running' && currentStatus === 'completed') {
        setConfirmationDialog({
          isOpen: true,
          classification: classification
        });
      }
    });
    
    // Update ref for next comparison
    prevMriqcStatusesRef.current = mriqcStatuses;
  }, [mriqcStatuses]);

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
      setMriqcStatuses(data);
    } catch (error) {
      console.error('Error fetching MRIQC status:', error);
    }
  };

  const runMriqc = async (classification) => {
    if (!selectedFolder) return;
    
    setProcessingMriqc(prev => ({ ...prev, [classification]: true }));
    
    try {
      const response = await fetch('/api/run_mriqc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folder_name: selectedFolder,
          subject_id: '01',
          classification: classification
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Update status to running immediately
        setMriqcStatuses(prev => ({
          ...prev,
          [classification]: { status: 'running', reports: [] }
        }));
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error running MRIQC:', error);
      alert('Failed to start MRIQC processing');
    } finally {
      setProcessingMriqc(prev => ({ ...prev, [classification]: false }));
    }
  };

  const viewMriqcReport = (report) => {
    window.open(report.path, '_blank');
  };

  const handleProceedToPreprocessing = () => {
    // Close dialog and navigate to preprocessing page
    setConfirmationDialog({ isOpen: false, classification: null });
    setCurrentPage('preprocessing');
  };

  const handleValidateResults = () => {
    const { classification } = confirmationDialog;
    const mriqcStatus = mriqcStatuses[classification];
    
    // Close dialog
    setConfirmationDialog({ isOpen: false, classification: null });
    
    // Open the first report if available
    if (mriqcStatus?.reports?.length > 0) {
      viewMriqcReport(mriqcStatus.reports[0]);
    }
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

  const downloadFile = (classification, filename) => {
    window.location.href = `/download_file/${selectedFolder}/${classification}/${filename}`;
  };

  const downloadClassification = (classification) => {
    window.location.href = `/download_classification/${selectedFolder}/${classification}`;
  };

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
      
      {/* NIfTI Viewer Modal */}
      {viewerFile && (
        <NiftiViewer 
          fileUrl={viewerFile.url}
          fileName={viewerFile.name}
          onClose={closeViewer}
        />
      )}
      
      {/* MRIQC Confirmation Dialog */}
      {confirmationDialog.isOpen && (
        <MriqcConfirmationDialog
          isOpen={confirmationDialog.isOpen}
          onClose={() => setConfirmationDialog({ isOpen: false, classification: null })}
          classification={confirmationDialog.classification}
          label={getClassificationLabel(confirmationDialog.classification)}
          color={getClassificationColor(confirmationDialog.classification)}
          mriqcResults={mriqcStatuses[confirmationDialog.classification]}
          onProceedToPreprocessing={handleProceedToPreprocessing}
          onValidateResults={handleValidateResults}
        />
      )}
      
      <div className="header">
        <h1>Dataset Classification & Quality Control</h1>
        <button className="back-btn" onClick={() => setCurrentPage('home')}>
          ← Back to Home
        </button>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
        <button style={{
          padding: '0.65rem 1.5rem',
          border: 'none',
          borderBottom: '2px solid #3b82f6',
          background: 'none',
          fontWeight: 600,
          color: '#3b82f6',
          cursor: 'pointer',
          marginBottom: '-2px',
          fontSize: '0.9rem'
        }}>
          Files & Quality Control
        </button>
        <button
          style={{
            padding: '0.65rem 1.5rem',
            border: 'none',
            borderBottom: '2px solid transparent',
            background: 'none',
            fontWeight: 500,
            color: '#6b7280',
            cursor: 'pointer',
            marginBottom: '-2px',
            fontSize: '0.9rem',
            transition: 'color 0.15s'
          }}
          onClick={() => setCurrentPage('preprocessing')}
          onMouseEnter={e => e.target.style.color = '#374151'}
          onMouseLeave={e => e.target.style.color = '#6b7280'}
        >
          Preprocessing Pipelines →
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
            {/* Classification Cards */}
            {classifiedFiles && Object.entries(classifiedFiles).map(([classification, files]) => {
              // Skip unclassified and empty classifications
              if (classification === 'unclassified' || files.length === 0) return null;
              
              const mriqcStatus = mriqcStatuses[classification] || { status: 'not_started', reports: [] };
              
              return (
                <ClassificationCard
                  key={classification}
                  classification={classification}
                  files={files}
                  color={getClassificationColor(classification)}
                  label={getClassificationLabel(classification)}
                  selectedFolder={selectedFolder}
                  mriqcStatus={mriqcStatus}
                  processingMriqc={processingMriqc[classification]}
                  onRunMriqc={runMriqc}
                  onViewReport={viewMriqcReport}
                  onViewFile={viewFile}
                  onDownloadFile={downloadFile}
                  onDownloadAll={() => downloadClassification(classification)}
                />
              );
            })}
            
            {/* Unclassified Files */}
            {classifiedFiles && classifiedFiles.unclassified && classifiedFiles.unclassified.length > 0 && (
              <ClassificationCard
                classification="unclassified"
                files={classifiedFiles.unclassified}
                color={getClassificationColor('unclassified')}
                label={getClassificationLabel('unclassified')}
                selectedFolder={selectedFolder}
                mriqcStatus={{ status: 'not_started', reports: [] }}
                processingMriqc={false}
                onRunMriqc={() => {}}
                onViewReport={() => {}}
                onViewFile={viewFile}
                onDownloadFile={downloadFile}
                onDownloadAll={() => downloadClassification('unclassified')}
              />
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        background: 'rgba(255, 255, 255, 0.9)',
        borderTop: '1px solid rgba(229, 231, 235, 0.5)',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        marginTop: '3rem'
      }}>
        <p style={{
          color: '#6b7280',
          fontSize: '0.875rem',
          margin: 0
        }}>
          Copyright © UAB EN4D2 Lab 2025
        </p>
      </footer>
    </div>
  );
};

export default ClassifyPage;
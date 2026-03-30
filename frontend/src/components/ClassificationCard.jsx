import React from 'react';
import MriqcSection from './MriqcSection.jsx';

const ClassificationCard = ({ 
  classification,
  files,
  color,
  label,
  selectedFolder,
  mriqcStatus,
  processingMriqc,
  onRunMriqc,
  onViewReport,
  onViewFile,
  onDownloadFile,
  onDownloadAll
}) => {
  // Check if MRIQC is supported for this classification
  const mriqcSupported = ['anat', 'func', 'dwi'].includes(classification);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="classification-card">
      <div 
        className="classification-header" 
        style={{borderColor: color}}
      >
        <div className="classification-title" style={{color: color}}>
          {label} ({files.length})
        </div>
        <div className="classification-actions">
          <button 
            className="download-btn"
            onClick={onDownloadAll}
          >
             Download All
          </button>
        </div>
      </div>
      
      {/* MRIQC Section - only show for supported types */}
      {mriqcSupported && (
        <MriqcSection
          classification={classification}
          mriqcStatus={mriqcStatus}
          processingMriqc={processingMriqc}
          onRunMriqc={onRunMriqc}
          onViewReport={onViewReport}
        />
      )}
      
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
                  onClick={() => onViewFile(classification, file.main_file)}
                >
                  View
                </button>
              )}
              <button 
                className="file-download-btn"
                onClick={() => onDownloadFile(classification, file.main_file)}
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassificationCard;
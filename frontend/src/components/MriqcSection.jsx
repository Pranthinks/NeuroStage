import React from 'react';

const MriqcSection = ({ 
  classification, 
  mriqcStatus, 
  processingMriqc, 
  onRunMriqc, 
  onViewReport 
}) => {
  const getMriqcStatusBadge = (status) => {
    const badges = {
      'not_started': { 
        text: 'QC Not Run', 
        color: '#6b7280', 
        bg: '#f3f4f6', 
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' 
      },
      'running': { 
        text: 'Processing...', 
        color: '#f59e0b', 
        bg: '#fef3c7', 
        icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' 
      },
      'completed': { 
        text: 'Complete', 
        color: '#10b981', 
        bg: '#d1fae5', 
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' 
      }
    };
    return badges[status] || badges['not_started'];
  };

  const statusBadge = getMriqcStatusBadge(mriqcStatus.status);

  return (
    <div className="mriqc-section">
      <div className="mriqc-controls">
        <div 
          className="mriqc-status-badge"
          style={{
            background: statusBadge.bg,
            color: statusBadge.color
          }}
        >
          <svg 
            className="mriqc-status-icon" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={statusBadge.icon} 
            />
          </svg>
          <span>{statusBadge.text}</span>
        </div>
        
        {mriqcStatus.status !== 'running' && (
          <button 
            className="mriqc-btn-small"
            onClick={() => onRunMriqc(classification)}
            disabled={processingMriqc}
          >
            {processingMriqc ? (
              <>
                <div className="spinner"></div>
                Starting...
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Run Quality Control
              </>
            )}
          </button>
        )}
      </div>
      
      {mriqcStatus.status === 'running' && (
        <div style={{marginTop: '0.75rem', textAlign: 'center', color: '#6b7280', fontSize: '0.75rem'}}>
          Processing quality metrics... (15-30 minutes)
        </div>
      )}
      
      {mriqcStatus.status === 'completed' && mriqcStatus.reports.length > 0 && (
        <div className="mriqc-reports">
          {mriqcStatus.reports.map((report, idx) => (
            <div 
              key={idx}
              className="mriqc-report-chip"
              onClick={() => onViewReport(report)}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {report.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MriqcSection;
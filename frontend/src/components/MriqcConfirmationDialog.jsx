import React from 'react';

const MriqcConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  classification,
  label,
  color,
  mriqcResults,
  onProceedToPreprocessing,
  onValidateResults
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="dialog-header" style={{ borderLeftColor: color }}>
            <div className="dialog-title-section">
              <svg width="24" height="24" fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h2 className="dialog-title">Quality Control Complete</h2>
                <p className="dialog-subtitle">{label}</p>
              </div>
            </div>
            <button className="dialog-close-btn" onClick={onClose}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="dialog-body">
            <div className="dialog-message">
              <svg width="48" height="48" fill="none" stroke="#10b981" viewBox="0 0 24 24" style={{ margin: '0 auto 1rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3>MRIQC Analysis Complete!</h3>
              <p>We've analyzed your {label.toLowerCase()} data and generated quality metrics. Here's what we found:</p>
            </div>

            {/* Results Summary */}
            <div className="results-summary">
              <div className="summary-card">
                <div className="summary-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="summary-label">Reports Generated</div>
                  <div className="summary-value">{mriqcResults?.reports?.length || 0}</div>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="summary-label">Quality Status</div>
                  <div className="summary-value">Analyzed</div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="info-box">
              <svg width="20" height="20" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong>What happens next?</strong>
                <p>You can review the detailed quality reports to validate the results, or proceed directly to the preprocessing stage if you're confident with the automated assessment.</p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="dialog-footer">
            <button 
              className="dialog-btn dialog-btn-secondary"
              onClick={onValidateResults}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Review Reports First
            </button>
            <button 
              className="dialog-btn dialog-btn-primary"
              onClick={onProceedToPreprocessing}
              style={{ background: color }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Proceed to Preprocessing
            </button>
          </div>
        </div>
      </div>

      <style>{dialogStyles}</style>
    </>
  );
};

const dialogStyles = `
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .dialog-content {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow: hidden;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    border-left: 4px solid;
  }

  .dialog-title-section {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .dialog-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  .dialog-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .dialog-close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 0.25rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
  }

  .dialog-close-btn:hover {
    background: #f3f4f6;
    color: #111827;
  }

  .dialog-body {
    padding: 1.5rem;
    overflow-y: auto;
    max-height: calc(90vh - 180px);
  }

  .dialog-message {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .dialog-message h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  .dialog-message p {
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
  }

  .results-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .summary-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.75rem;
    border: 1px solid #e5e7eb;
  }

  .summary-icon {
    width: 40px;
    height: 40px;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .summary-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  .summary-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin-top: 0.25rem;
  }

  .info-box {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 0.75rem;
    color: #1e40af;
  }

  .info-box svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .info-box strong {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: 600;
  }

  .info-box p {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .dialog-footer {
    display: flex;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .dialog-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .dialog-btn-secondary {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .dialog-btn-secondary:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  .dialog-btn-primary {
    color: white;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .dialog-btn-primary:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .dialog-btn:active {
    transform: translateY(0);
  }
`;

export default MriqcConfirmationDialog;
// Utility functions for ClassifyPage

export const getClassificationLabel = (key) => {
  const labels = {
    'anat': 'Anatomical (T1w/T2w)',
    'func': 'Functional (BOLD)',
    'dwi': 'Diffusion (DWI)',
    'perf': 'Perfusion (ASL)',
    'unclassified': 'Unclassified'
  };
  return labels[key] || key;
};

export const getClassificationColor = (key) => {
  const colors = {
    'anat': '#3b82f6',
    'func': '#fb923c',
    'dwi': '#8b5cf6',
    'perf': '#ef4444',
    'unclassified': '#6b7280'
  };
  return colors[key] || '#6b7280';
};

export const styles = `
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
  .classification-card { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
  .classification-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 2px solid; }
  .classification-title { font-size: 1.25rem; font-weight: 600; color: #111827; }
  .classification-actions { display: flex; gap: 0.5rem; align-items: center; }
  .download-btn { background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: background 0.2s; }
  .download-btn:hover { background: #2563eb; }
  .mriqc-section { margin-bottom: 1rem; padding: 1rem; background: #f9fafb; border-radius: 0.5rem; }
  .mriqc-controls { display: flex; justify-content: space-between; align-items: center; }
  .mriqc-status-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; }
  .mriqc-status-icon { width: 20px; height: 20px; }
  .mriqc-btn-small { background: #10b981; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: background 0.2s; display: flex; align-items: center; gap: 0.5rem; }
  .mriqc-btn-small:hover { background: #059669; }
  .mriqc-btn-small:disabled { background: #9ca3af; cursor: not-allowed; }
  .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .mriqc-reports { margin-top: 0.75rem; display: flex; flex-wrap: gap; gap: 0.5rem; }
  .mriqc-report-chip { background: white; border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.375rem; }
  .mriqc-report-chip:hover { border-color: #3b82f6; background: #eff6ff; }
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
  .processing-spinner { width: 48px; height: 48px; border: 4px solid #f3f4f6; border-top: 4px solid #f59e0b; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
`;
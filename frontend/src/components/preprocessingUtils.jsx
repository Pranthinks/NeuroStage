// Preprocessing pipeline configurations
// Each pipeline has its own dedicated backend endpoints

export const PIPELINES = {
  anat: [
    {
      id: 'freesurfer',
      name: 'FreeSurfer',
      description: 'Cortical surface reconstruction and parcellation. Requires T1w images only.',
      docker_image: 'freesurfer/freesurfer:7.4.1',
      badge: 'T1w only',
      badgeColor: '#3b82f6',
      estimatedTime: '8-12 hours',
      icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
      fileFilter: (filename) => filename.toLowerCase().includes('t1'),
      // endpoints — will be added when freesurfer_preprocessing.py is created
      runEndpoint:     '/api/run_freesurfer',
      statusEndpoint:  (folder) => `/api/freesurfer_status/${folder}`,
      resultsEndpoint: (folder) => `/api/freesurfer_results/${folder}`,
      logsEndpoint:    (folder) => `/api/freesurfer_logs/${folder}`,
      reportEndpoint:  (folder, file) => `/api/freesurfer_report/${folder}/${file}`,
    },
    {
      id: 'hcp',
      name: 'HCP Pipeline',
      description: 'Human Connectome Project minimal preprocessing. Uses both T1w and T2w images.',
      docker_image: 'humanconnectome/hcp_pipeline:latest',
      badge: 'T1w + T2w',
      badgeColor: '#6366f1',
      estimatedTime: '4-8 hours',
      icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
      fileFilter: null,
      // endpoints — will be added when hcp_preprocessing.py is created
      runEndpoint:     '/api/run_hcp',
      statusEndpoint:  (folder) => `/api/hcp_status/${folder}`,
      resultsEndpoint: (folder) => `/api/hcp_results/${folder}`,
      logsEndpoint:    (folder) => `/api/hcp_logs/${folder}`,
      reportEndpoint:  (folder, file) => `/api/hcp_report/${folder}/${file}`,
    }
  ],
  func: [
    {
      id: 'fmriprep',
      name: 'fMRIPrep',
      description: 'Robust preprocessing pipeline for functional MRI (BOLD) data.',
      docker_image: 'nipreps/fmriprep:latest',
      badge: 'BOLD',
      badgeColor: '#fb923c',
      estimatedTime: '2-6 hours',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      fileFilter: null,
      runEndpoint:     '/api/run_fmriprep',
      statusEndpoint:  (folder) => `/api/fmriprep_status/${folder}`,
      resultsEndpoint: (folder) => `/api/fmriprep_results/${folder}`,
      logsEndpoint:    (folder) => `/api/fmriprep_logs/${folder}`,
      reportEndpoint:  (folder, file) => `/api/fmriprep_report/${folder}/${file}`,
    }
  ],
  dwi: [
    {
      id: 'qsiprep',
      name: 'QSIPrep',
      description: 'Preprocessing and reconstruction of diffusion weighted MRI data.',
      docker_image: 'pennbbl/qsiprep:latest',
      badge: 'DWI',
      badgeColor: '#8b5cf6',
      estimatedTime: '2-4 hours',
      icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
      fileFilter: null,
      runEndpoint:     '/api/run_qsiprep',
      statusEndpoint:  (folder) => `/api/qsiprep_status/${folder}`,
      resultsEndpoint: (folder) => `/api/qsiprep_results/${folder}`,
      logsEndpoint:    (folder) => `/api/qsiprep_logs/${folder}`,
      reportEndpoint:  (folder, file) => `/api/qsiprep_report/${folder}/${file}`,
    }
  ],
  perf: [
    {
      id: 'aslprep',
      name: 'ASLPrep',
      description: 'Preprocessing pipeline for Arterial Spin Labeling (ASL/PCASL) perfusion data.',
      docker_image: 'pennlinc/aslprep:latest',
      badge: 'PCASL',
      badgeColor: '#ef4444',
      estimatedTime: '1-3 hours',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      fileFilter: null,
      runEndpoint:     '/api/run_aslprep',
      statusEndpoint:  (folder) => `/api/aslprep_status/${folder}`,
      resultsEndpoint: (folder) => `/api/aslprep_results/${folder}`,
      logsEndpoint:    (folder) => `/api/aslprep_logs/${folder}`,
      reportEndpoint:  (folder, file) => `/api/aslprep_report/${folder}/${file}`,
    }
  ]
};

// Get files relevant to a specific pipeline
export const getFilteredFiles = (files, pipeline) => {
  if (!pipeline.fileFilter) return files;
  return files.filter(f => pipeline.fileFilter(f.main_file));
};

export const getClassificationLabel = (key) => {
  const labels = {
    'anat': 'Anatomical (T1w/T2w)',
    'func': 'Functional (BOLD)',
    'dwi':  'Diffusion (DWI)',
    'perf': 'Perfusion (ASL)',
  };
  return labels[key] || key;
};

export const getClassificationColor = (key) => {
  const colors = {
    'anat': '#3b82f6',
    'func': '#fb923c',
    'dwi':  '#8b5cf6',
    'perf': '#ef4444',
  };
  return colors[key] || '#6b7280';
};

export const preprocessingStyles = `
  .preproc-container { min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%); font-family: system-ui, -apple-system, sans-serif; padding: 2rem; }

  .preproc-section { margin-bottom: 2rem; background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

  .preproc-section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid; }
  .preproc-section-title { font-size: 1.25rem; font-weight: 700; }
  .preproc-section-badge { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; }

  .pipeline-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }

  .pipeline-card { border: 1.5px solid #e5e7eb; border-radius: 0.75rem; padding: 1.25rem; transition: all 0.2s; position: relative; overflow: hidden; }
  .pipeline-card:hover { border-color: #93c5fd; box-shadow: 0 4px 12px rgba(59,130,246,0.1); }

  .pipeline-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
  .pipeline-name { font-size: 1.1rem; font-weight: 700; color: #111827; }
  .pipeline-badge { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; text-transform: uppercase; }

  .pipeline-desc { font-size: 0.85rem; color: #6b7280; line-height: 1.5; margin-bottom: 1rem; }

  .pipeline-meta { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
  .pipeline-meta-item { display: flex; align-items: center; gap: 0.375rem; font-size: 0.78rem; color: #6b7280; }

  .pipeline-docker { font-size: 0.72rem; font-family: monospace; background: #f3f4f6; color: #374151; padding: 0.35rem 0.6rem; border-radius: 0.375rem; margin-bottom: 1rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .pipeline-run-btn { width: 100%; padding: 0.65rem; border: none; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: white; }
  .pipeline-run-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .pipeline-run-btn:disabled { background: #9ca3af !important; cursor: not-allowed; transform: none; }

  .pipeline-run-btn-warn { width: 100%; padding: 0.65rem; border: 1.5px solid #f59e0b; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; cursor: not-allowed; background: #fffbeb; color: #b45309; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

  .pipeline-status-badge { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; font-weight: 600; padding: 0.3rem 0.75rem; border-radius: 999px; margin-top: 0.75rem; }

  .status-running { background: #fef3c7; color: #b45309; }
  .status-completed { background: #d1fae5; color: #065f46; }
  .status-failed { background: #fee2e2; color: #991b1b; }

  .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; flex-shrink: 0; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  .empty-preproc { text-align: center; padding: 3rem; color: #9ca3af; background: #f9fafb; border-radius: 0.75rem; border: 1.5px dashed #e5e7eb; }
  .empty-preproc p { margin-top: 0.75rem; font-size: 0.9rem; }

  .logs-panel { margin-top: 1rem; background: #0f172a; border-radius: 0.5rem; padding: 1rem; max-height: 200px; overflow-y: auto; }
  .logs-text { font-family: monospace; font-size: 0.75rem; color: #94a3b8; white-space: pre-wrap; }
  .logs-toggle { font-size: 0.78rem; color: #6b7280; background: none; border: none; cursor: pointer; padding: 0; margin-top: 0.5rem; text-decoration: underline; }
`;
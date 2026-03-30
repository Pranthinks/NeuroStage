import React, { useState, useEffect } from 'react';
import { PIPELINES, getFilteredFiles, getClassificationLabel, getClassificationColor, preprocessingStyles } from './preprocessingUtils.jsx';

const PreprocessingPage = ({ setCurrentPage }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [classifiedFiles, setClassifiedFiles] = useState(null);
  const [loadingFolders, setLoadingFolders] = useState(true);

  // { [pipelineId]: 'not_started' | 'running' | 'completed' | 'failed' }
  const [pipelineStatuses, setPipelineStatuses] = useState({});
  // { [pipelineId]: { reports: [], files: {} } }
  const [pipelineResults, setPipelineResults] = useState({});
  // { [pipelineId]: string }
  const [pipelineLogs, setPipelineLogs] = useState({});

  useEffect(() => {
    fetchFolders();
  }, []);

  // On folder change: fetch files + statuses once, no interval
  useEffect(() => {
    if (selectedFolder) {
      fetchClassifiedFiles(selectedFolder);
      fetchAllStatuses(selectedFolder);
    }
  }, [selectedFolder]);

  // Only start polling interval when at least one pipeline is running
  useEffect(() => {
    const anyRunning = Object.values(pipelineStatuses).some(s => s === 'running');
    if (!anyRunning || !selectedFolder) return;

    const interval = setInterval(() => fetchAllStatuses(selectedFolder), 15000);
    return () => clearInterval(interval);
  }, [pipelineStatuses, selectedFolder]);

  // Auto-fetch results when any pipeline completes
  useEffect(() => {
    Object.entries(pipelineStatuses).forEach(([pipelineId, status]) => {
      if (status === 'completed' && !pipelineResults[pipelineId]) {
        const pipeline = getAllPipelines().find(p => p.id === pipelineId);
        if (pipeline) fetchResults(pipeline);
      }
    });
  }, [pipelineStatuses]);

  const getAllPipelines = () => Object.values(PIPELINES).flat();

  const fetchFolders = async () => {
    try {
      const res = await fetch('/get_folders');
      const data = await res.json();
      if (data.status === 'success') {
        setFolders(data.folders);
        if (data.folders.length > 0) setSelectedFolder(data.folders[0].name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFolders(false);
    }
  };

  const fetchClassifiedFiles = async (folderName) => {
    try {
      const res = await fetch(`/get_classified_files/${folderName}`);
      const data = await res.json();
      if (data.status === 'success') setClassifiedFiles(data.classified_files);
    } catch (e) {
      console.error(e);
    }
  };

  // Poll each pipeline's own status endpoint
  const fetchAllStatuses = async (folderName) => {
    const allPipelines = getAllPipelines();
    const updates = {};

    await Promise.all(allPipelines.map(async (pipeline) => {
      try {
        const res = await fetch(pipeline.statusEndpoint(folderName));
        const data = await res.json();
        updates[pipeline.id] = data.status;
      } catch (e) {
        // endpoint not ready (e.g. freesurfer/hcp not created yet) — ignore
      }
    }));

    if (Object.keys(updates).length > 0) {
      setPipelineStatuses(prev => ({ ...prev, ...updates }));
    }
  };

  const fetchResults = async (pipeline) => {
    try {
      const res = await fetch(pipeline.resultsEndpoint(selectedFolder));
      const data = await res.json();
      if (data.status === 'success') {
        setPipelineResults(prev => ({ ...prev, [pipeline.id]: data }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async (pipeline) => {
    try {
      const res = await fetch(pipeline.logsEndpoint(selectedFolder));
      const data = await res.json();
      setPipelineLogs(prev => ({ ...prev, [pipeline.id]: data.logs || 'No logs available' }));
    } catch (e) {
      setPipelineLogs(prev => ({ ...prev, [pipeline.id]: 'Failed to fetch logs' }));
    }
  };

  const runPipeline = async (classification, pipeline, filteredFiles) => {
    if (!selectedFolder) return;

    setPipelineStatuses(prev => ({ ...prev, [pipeline.id]: 'running' }));

    try {
      const res = await fetch(pipeline.runEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder_name: selectedFolder,
          subject_id: '01',
          input_files: filteredFiles.map(f => f.main_file)
        })
      });
      const data = await res.json();

      if (data.status !== 'success') {
        setPipelineStatuses(prev => ({ ...prev, [pipeline.id]: 'failed' }));
        setPipelineLogs(prev => ({ ...prev, [pipeline.id]: data.message }));
      }
    } catch (e) {
      setPipelineStatuses(prev => ({ ...prev, [pipeline.id]: 'failed' }));
      setPipelineLogs(prev => ({ ...prev, [pipeline.id]: e.message }));
    }
  };

  const openReport = (pipeline, filename) => {
    window.open(pipeline.reportEndpoint(selectedFolder, filename), '_blank');
  };

  const getPipelineStatus = (pipelineId) => pipelineStatuses[pipelineId] || 'not_started';
  const getAllFiles = (classification) => (classifiedFiles && classifiedFiles[classification]) || [];

  // ── Sub-components ────────────────────────────────────────────────

  const StatusBadge = ({ status }) => {
    if (status === 'running') return (
      <div className="pipeline-status-badge status-running">
        <div className="spinner-sm" style={{ border: '2px solid rgba(180,83,9,0.3)', borderTop: '2px solid #b45309' }}></div>
        Running...
      </div>
    );
    if (status === 'completed') return (
      <div className="pipeline-status-badge status-completed">✓ Completed</div>
    );
    if (status === 'failed') return (
      <div className="pipeline-status-badge status-failed">✗ Failed</div>
    );
    return null;
  };

  const ResultsPanel = ({ pipeline }) => {
    const results  = pipelineResults[pipeline.id];
    const logs     = pipelineLogs[pipeline.id];
    const status   = getPipelineStatus(pipeline.id);
    const [showLogs, setShowLogs] = useState(false);

    return (
      <div style={{ marginTop: '0.75rem' }}>
        {/* HTML reports — shown when completed */}
        {status === 'completed' && results && results.reports.length > 0 && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Reports
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {results.reports.map((report, i) => (
                <button key={i} onClick={() => openReport(pipeline, report)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  borderRadius: '0.375rem', padding: '0.4rem 0.75rem',
                  fontSize: '0.78rem', color: '#1d4ed8', cursor: 'pointer', fontWeight: 500
                }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {report}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Logs toggle */}
        <button className="logs-toggle" onClick={() => {
          setShowLogs(!showLogs);
          if (!logs) fetchLogs(pipeline);
        }}>
          {showLogs ? 'Hide logs ▲' : 'Show logs ▼'}
        </button>
        {showLogs && (
          <div className="logs-panel">
            <div className="logs-text">{logs || 'Loading...'}</div>
          </div>
        )}
      </div>
    );
  };

  const FileChip = ({ file, dimmed }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      background: dimmed ? '#f9fafb' : '#f3f4f6',
      border: `1px solid ${dimmed ? '#f3f4f6' : '#e5e7eb'}`,
      borderRadius: '0.375rem', padding: '0.25rem 0.6rem',
      fontSize: '0.72rem', color: dimmed ? '#9ca3af' : '#374151',
      fontFamily: 'monospace', textDecoration: dimmed ? 'line-through' : 'none'
    }}>
      {file.main_file}
    </span>
  );

  const PipelineCard = ({ classification, pipeline }) => {
    const status        = getPipelineStatus(pipeline.id);
    const isRunning          = status === 'running';
    const anyPipelineRunning = Object.values(pipelineStatuses).some(s => s === 'running');
    const color         = getClassificationColor(classification);
    const allFiles      = getAllFiles(classification);
    const filteredFiles = getFilteredFiles(allFiles, pipeline);
    const excludedFiles = allFiles.filter(f => !filteredFiles.includes(f));
    const canRun        = filteredFiles.length > 0;

    return (
      <div className="pipeline-card">
        <div className="pipeline-card-top">
          <div className="pipeline-name">{pipeline.name}</div>
          <span className="pipeline-badge" style={{ background: pipeline.badgeColor + '20', color: pipeline.badgeColor }}>
            {pipeline.badge}
          </span>
        </div>

        <div className="pipeline-desc">{pipeline.description}</div>

        {/* Input files */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Input files
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {filteredFiles.map((f, i) => <FileChip key={i} file={f} dimmed={false} />)}
            {excludedFiles.map((f, i) => <FileChip key={'ex' + i} file={f} dimmed={true} />)}
          </div>
          {excludedFiles.length > 0 && (
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.35rem', fontStyle: 'italic' }}>
              Strikethrough files not used by this pipeline
            </div>
          )}
          {!canRun && (
            <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '0.4rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.375rem', padding: '0.4rem 0.6rem' }}>
              ⚠ No compatible files found
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="pipeline-meta">
          <div className="pipeline-meta-item">
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {pipeline.estimatedTime}
          </div>
          <div className="pipeline-meta-item">
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Docker
          </div>
        </div>

        <div className="pipeline-docker">{pipeline.docker_image}</div>

        {canRun ? (
          <button className="pipeline-run-btn" style={{ background: color }}
            onClick={() => runPipeline(classification, pipeline, filteredFiles)}
            disabled={anyPipelineRunning}
          >
            {isRunning
              ? <><div className="spinner-sm"></div> Starting...</>
              : <>
                  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={pipeline.icon} />
                  </svg>
                  Run {pipeline.name} ({filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''})
                </>
            }
          </button>
        ) : (
          <div className="pipeline-run-btn-warn">⚠ No compatible files to process</div>
        )}

        <StatusBadge status={status} />

        {status !== 'not_started' && <ResultsPanel pipeline={pipeline} />}
      </div>
    );
  };

  const ClassificationSection = ({ classification }) => {
    const pipelines = PIPELINES[classification];
    if (!pipelines) return null;

    const color = getClassificationColor(classification);
    const label = getClassificationLabel(classification);
    const files = getAllFiles(classification);

    return (
      <div className="preproc-section">
        <div className="preproc-section-header" style={{ borderBottomColor: color }}>
          <svg width="20" height="20" fill="none" stroke={color} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="preproc-section-title" style={{ color }}>{label}</span>
          <span className="preproc-section-badge" style={{ background: color + '20', color }}>
            {files.length} file{files.length !== 1 ? 's' : ''} • {pipelines.length} pipeline{pipelines.length > 1 ? 's' : ''}
          </span>
          {files.length === 0 && (
            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#9ca3af', fontStyle: 'italic' }}>
              No files uploaded
            </span>
          )}
        </div>

        {files.length === 0 ? (
          <div className="empty-preproc">
            <svg width="32" height="32" fill="none" stroke="#d1d5db" viewBox="0 0 24 24" style={{ margin: '0 auto' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Upload {label.toLowerCase()} files first</p>
          </div>
        ) : (
          <div className="pipeline-grid">
            {pipelines.map(pipeline => (
              <PipelineCard key={pipeline.id} classification={classification} pipeline={pipeline} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────

  if (loadingFolders) {
    return (
      <div className="preproc-container">
        <style>{preprocessingStyles}</style>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="preproc-container">
      <style>{preprocessingStyles}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.25rem' }}>Preprocessing Pipelines</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Run neuroimaging preprocessing on your converted BIDS data</p>
        </div>
        <button style={{ background: '#6b7280', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}
          onClick={() => setCurrentPage('classify')}>
          ← Back to Files
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
        <button style={{ padding: '0.65rem 1.5rem', border: 'none', borderBottom: '2px solid transparent', background: 'none', fontWeight: 500, color: '#6b7280', cursor: 'pointer', marginBottom: '-2px', fontSize: '0.9rem' }}
          onClick={() => setCurrentPage('classify')}
          onMouseEnter={e => e.target.style.color = '#374151'}
          onMouseLeave={e => e.target.style.color = '#6b7280'}>
          ← Files & Quality Control
        </button>
        <button style={{ padding: '0.65rem 1.5rem', border: 'none', borderBottom: '2px solid #3b82f6', background: 'none', fontWeight: 600, color: '#3b82f6', cursor: 'pointer', marginBottom: '-2px', fontSize: '0.9rem' }}>
          Preprocessing Pipelines
        </button>
      </div>

      {folders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280', background: 'white', borderRadius: '1rem' }}>
          <p>No datasets found. Upload DICOM files first.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem' }}>
          {/* Sidebar */}
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>Your Datasets</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {folders.map(folder => (
                <div key={folder.name} onClick={() => setSelectedFolder(folder.name)} style={{
                  padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer',
                  border: `1px solid ${selectedFolder === folder.name ? '#3b82f6' : 'transparent'}`,
                  background: selectedFolder === folder.name ? '#eff6ff' : 'transparent', transition: 'all 0.15s'
                }}>
                  <div style={{ fontWeight: 500, color: '#111827', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{folder.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    {folder.file_count} files • {new Date(folder.created * 1000).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main */}
          <div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <svg width="18" height="18" fill="none" stroke="#3b82f6" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 2 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div style={{ fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.5 }}>
                <strong>Pipelines run inside Docker containers.</strong> Make sure Docker is running before starting. Reports open in a new tab when completed.
              </div>
            </div>

            {['anat', 'func', 'dwi', 'perf'].map(cls => (
              <ClassificationSection key={cls} classification={cls} />
            ))}
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

export default PreprocessingPage;
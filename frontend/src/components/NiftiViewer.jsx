import React, { useEffect, useRef, useState } from 'react';
import { Niivue } from '@niivue/niivue';

const NiftiViewerAdvanced = ({ fileUrl, fileName, onClose }) => {
  const canvasRef = useRef(null);
  const nvRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeColormap, setActiveColormap] = useState('gray');
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [sliceType, setSliceType] = useState('axial'); // Changed from 'multi' to 'axial'
  const [opacity, setOpacity] = useState(1);
  const [brightness, setBrightness] = useState(0.5);
  const [contrast, setContrast] = useState(0.5);
  const [showRadiological, setShowRadiological] = useState(false);
  const [imageInfo, setImageInfo] = useState(null);

  // Available color maps
  const colormaps = [
    { name: 'gray', label: 'Grayscale' },
    { name: 'viridis', label: 'Viridis' },
    { name: 'plasma', label: 'Plasma' },
    { name: 'inferno', label: 'Inferno' },
    { name: 'hot', label: 'Hot' },
    { name: 'cool', label: 'Cool' },
    { name: 'winter', label: 'Winter' },
    { name: 'red', label: 'Red' },
    { name: 'green', label: 'Green' },
    { name: 'blue', label: 'Blue' }
  ];

  useEffect(() => {
    const initViewer = async () => {
      if (canvasRef.current && !nvRef.current) {
        try {
          console.log('Initializing Advanced Niivue viewer...');
          
          nvRef.current = new Niivue({
            backColor: [0, 0, 0, 1],
            show3Dcrosshair: true,
            logging: true,
            crosshairColor: [0, 1, 0, 1], // Green crosshair
            textHeight: 0.03,
            colorbarHeight: 0.05,
            crosshairWidth: 1,
            ruler: true,
            dragMode: nvRef.current?.dragModes?.pan || 1,
            multiplanarForceRender: false, // Changed to false
            meshThicknessOn2D: 0.5
          });
          
          nvRef.current.attachToCanvas(canvasRef.current);
          
          if (fileUrl) {
            const response = await fetch(fileUrl);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            await nvRef.current.loadVolumes([
              {
                url: blobUrl,
                name: fileName,
                colormap: 'gray',
                opacity: 1
              }
            ]);
            
            // Start with axial view (no 3D rendering)
            nvRef.current.setSliceType(nvRef.current.sliceTypeAxial);
            
            // Get image information
            if (nvRef.current.volumes.length > 0) {
              const vol = nvRef.current.volumes[0];
              setImageInfo({
                dimensions: `${vol.dims[1]} × ${vol.dims[2]} × ${vol.dims[3]}`,
                voxelSize: `${vol.pixDims[1].toFixed(2)} × ${vol.pixDims[2].toFixed(2)} × ${vol.pixDims[3].toFixed(2)} mm`,
                dataType: vol.datatypeCode,
                min: vol.global_min?.toFixed(2),
                max: vol.global_max?.toFixed(2)
              });
            }
            
            console.log('File loaded successfully!');
            setLoading(false);
            
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          }
        } catch (err) {
          console.error('Error loading NIfTI file:', err);
          setError(`Failed to load NIfTI file: ${err.message}`);
          setLoading(false);
        }
      }
    };

    initViewer();

    return () => {
      if (nvRef.current) {
        nvRef.current = null;
      }
    };
  }, [fileUrl, fileName]);

  // Change colormap
  const changeColormap = (colormapName) => {
    if (nvRef.current && nvRef.current.volumes.length > 0) {
      nvRef.current.volumes[0].colormap = colormapName;
      nvRef.current.updateGLVolume();
      setActiveColormap(colormapName);
    }
  };

  // Toggle crosshair
  const toggleCrosshair = () => {
    if (nvRef.current) {
      const newState = !showCrosshair;
      nvRef.current.opts.show3Dcrosshair = newState;
      nvRef.current.drawScene();
      setShowCrosshair(newState);
    }
  };

  // Change slice type
  const changeSliceType = (type) => {
    if (nvRef.current) {
      switch(type) {
        case 'axial':
          nvRef.current.setSliceType(nvRef.current.sliceTypeAxial);
          break;
        case 'coronal':
          nvRef.current.setSliceType(nvRef.current.sliceTypeCoronal);
          break;
        case 'sagittal':
          nvRef.current.setSliceType(nvRef.current.sliceTypeSagittal);
          break;
        default:
          break;
      }
      setSliceType(type);
    }
  };

  // Change opacity
  const handleOpacityChange = (e) => {
    const value = parseFloat(e.target.value);
    if (nvRef.current && nvRef.current.volumes.length > 0) {
      nvRef.current.volumes[0].opacity = value;
      nvRef.current.updateGLVolume();
      setOpacity(value);
    }
  };

  // Change brightness
  const handleBrightnessChange = (e) => {
    const value = parseFloat(e.target.value);
    if (nvRef.current && nvRef.current.volumes.length > 0) {
      const vol = nvRef.current.volumes[0];
      const range = vol.global_max - vol.global_min;
      vol.cal_min = vol.global_min + (range * value * 0.5);
      vol.cal_max = vol.global_max - (range * (1 - value) * 0.5);
      nvRef.current.updateGLVolume();
      setBrightness(value);
    }
  };

  // Change contrast
  const handleContrastChange = (e) => {
    const value = parseFloat(e.target.value);
    if (nvRef.current && nvRef.current.volumes.length > 0) {
      const vol = nvRef.current.volumes[0];
      const center = (vol.global_max + vol.global_min) / 2;
      const range = vol.global_max - vol.global_min;
      const width = range * value;
      vol.cal_min = center - width / 2;
      vol.cal_max = center + width / 2;
      nvRef.current.updateGLVolume();
      setContrast(value);
    }
  };

  // Toggle radiological view
  const toggleRadiological = () => {
    if (nvRef.current) {
      const newState = !showRadiological;
      nvRef.current.setRadiologicalConvention(newState);
      setShowRadiological(newState);
    }
  };

  // Reset view
  const resetView = () => {
    if (nvRef.current) {
      nvRef.current.setSliceType(nvRef.current.sliceTypeAxial); // Changed from multiplanar to axial
      if (nvRef.current.volumes.length > 0) {
        nvRef.current.volumes[0].opacity = 1;
        nvRef.current.volumes[0].colormap = 'gray';
        const vol = nvRef.current.volumes[0];
        vol.cal_min = vol.global_min;
        vol.cal_max = vol.global_max;
        nvRef.current.updateGLVolume();
      }
      setOpacity(1);
      setBrightness(0.5);
      setContrast(0.5);
      setActiveColormap('gray');
      setSliceType('axial'); // Changed from 'multi' to 'axial'
    }
  };

  // Take screenshot
  const takeScreenshot = () => {
    if (nvRef.current) {
      const canvas = canvasRef.current;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${fileName}_screenshot.png`;
      link.href = url;
      link.click();
    }
  };

  const styles = `
    .viewer-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    
    .viewer-container {
      background: #1f2937;
      border-radius: 1rem;
      width: 100%;
      max-width: 1600px;
      height: 95vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    
    .viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #374151;
      background: #111827;
      border-radius: 1rem 1rem 0 0;
    }
    
    .viewer-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #f9fafb;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    
    .icon-btn {
      background: #374151;
      color: #d1d5db;
      border: none;
      padding: 0.5rem;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .icon-btn:hover {
      background: #4b5563;
      color: #f9fafb;
    }
    
    .close-btn {
      background: #ef4444;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .close-btn:hover {
      background: #dc2626;
    }
    
    .viewer-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    .viewer-sidebar {
      width: 280px;
      background: #111827;
      border-right: 1px solid #374151;
      overflow-y: auto;
      padding: 1rem;
    }
    
    .sidebar-section {
      margin-bottom: 1.5rem;
    }
    
    .section-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }
    
    .colormap-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }
    
    .colormap-btn {
      background: #374151;
      color: #d1d5db;
      border: 2px solid transparent;
      padding: 0.5rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s;
      text-align: center;
    }
    
    .colormap-btn:hover {
      background: #4b5563;
    }
    
    .colormap-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #60a5fa;
    }
    
    .slider-control {
      margin-bottom: 1rem;
    }
    
    .slider-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #9ca3af;
      margin-bottom: 0.5rem;
    }
    
    .slider {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: #374151;
      outline: none;
      -webkit-appearance: none;
    }
    
    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #3b82f6;
      cursor: pointer;
    }
    
    .slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #3b82f6;
      cursor: pointer;
      border: none;
    }
    
    .info-grid {
      display: grid;
      gap: 0.5rem;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #d1d5db;
      padding: 0.5rem;
      background: #1f2937;
      border-radius: 0.375rem;
    }
    
    .info-label {
      color: #9ca3af;
      font-weight: 500;
    }
    
    .info-value {
      color: #f9fafb;
      font-family: monospace;
    }
    
    .viewer-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background: #000;
      padding: 1rem;
    }
    
    .viewer-canvas {
      width: 100%;
      height: 100%;
      border-radius: 0.5rem;
    }
    
    .loading-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      z-index: 10;
    }
    
    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #374151;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .loading-text {
      color: #d1d5db;
      font-size: 0.875rem;
    }
    
    .error-message {
      color: #fca5a5;
      padding: 2rem;
      background: #7f1d1d;
      border-radius: 0.5rem;
      text-align: center;
      max-width: 500px;
      margin: 0 auto;
    }
    
    .viewer-controls {
      padding: 1rem 1.5rem;
      border-top: 1px solid #374151;
      background: #111827;
      border-radius: 0 0 1rem 1rem;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }
    
    .control-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .control-label {
      font-size: 0.75rem;
      color: #9ca3af;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .control-btn {
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
      padding: 0.375rem 0.75rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s;
      font-weight: 500;
    }
    
    .control-btn:hover {
      background: #4b5563;
      color: #f9fafb;
    }
    
    .control-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
    
    .control-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .divider {
      width: 1px;
      height: 24px;
      background: #374151;
    }

    .toggle-btn {
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
      padding: 0.375rem 0.75rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s;
      font-weight: 500;
    }

    .toggle-btn.active {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }

    .toggle-btn:hover {
      background: #4b5563;
    }
  `;

  return (
    <div className="viewer-overlay" onClick={onClose}>
      <style>{styles}</style>
      <div className="viewer-container" onClick={(e) => e.stopPropagation()}>
        <div className="viewer-header">
          <div className="viewer-title">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {fileName}
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={takeScreenshot} title="Take Screenshot">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="icon-btn" onClick={resetView} title="Reset View">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button className="close-btn" onClick={onClose}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
        </div>
        
        <div className="viewer-body">
          <div className="viewer-sidebar">
            <div className="sidebar-section">
              <div className="section-title">Color Maps</div>
              <div className="colormap-grid">
                {colormaps.map(cm => (
                  <button
                    key={cm.name}
                    className={`colormap-btn ${activeColormap === cm.name ? 'active' : ''}`}
                    onClick={() => changeColormap(cm.name)}
                  >
                    {cm.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-section">
              <div className="section-title">Display Controls</div>
              
              <div className="slider-control">
                <div className="slider-label">
                  <span>Opacity</span>
                  <span>{(opacity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={opacity}
                  onChange={handleOpacityChange}
                  className="slider"
                />
              </div>

              <div className="slider-control">
                <div className="slider-label">
                  <span>Brightness</span>
                  <span>{(brightness * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={brightness}
                  onChange={handleBrightnessChange}
                  className="slider"
                />
              </div>

              <div className="slider-control">
                <div className="slider-label">
                  <span>Contrast</span>
                  <span>{(contrast * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={contrast}
                  onChange={handleContrastChange}
                  className="slider"
                />
              </div>
            </div>

            {imageInfo && (
              <div className="sidebar-section">
                <div className="section-title">Image Information</div>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Dimensions:</span>
                    <span className="info-value">{imageInfo.dimensions}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Voxel Size:</span>
                    <span className="info-value">{imageInfo.voxelSize}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Min Value:</span>
                    <span className="info-value">{imageInfo.min}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Max Value:</span>
                    <span className="info-value">{imageInfo.max}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="viewer-content">
            {loading && !error && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <div className="loading-text">Loading NIfTI file...</div>
              </div>
            )}
            
            {error && (
              <div className="loading-overlay">
                <div className="error-message">
                  <h3 style={{marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: '600'}}>
                    Error Loading File
                  </h3>
                  <p style={{marginBottom: '1rem'}}>{error}</p>
                  <p style={{fontSize: '0.875rem', color: '#fca5a5'}}>
                    Please check the browser console for more details.
                  </p>
                </div>
              </div>
            )}
            
            <canvas ref={canvasRef} className="viewer-canvas" />
          </div>
        </div>
        
        {!loading && !error && (
          <div className="viewer-controls">
            <div className="control-group">
              <span className="control-label">View:</span>
              <button 
                className={`control-btn ${sliceType === 'axial' ? 'active' : ''}`}
                onClick={() => changeSliceType('axial')}
              >
                Axial
              </button>
              <button 
                className={`control-btn ${sliceType === 'coronal' ? 'active' : ''}`}
                onClick={() => changeSliceType('coronal')}
              >
                Coronal
              </button>
              <button 
                className={`control-btn ${sliceType === 'sagittal' ? 'active' : ''}`}
                onClick={() => changeSliceType('sagittal')}
              >
                Sagittal
              </button>
            </div>

            <div className="divider"></div>

            <div className="control-group">
              <span className="control-label">Options:</span>
              <button 
                className={`toggle-btn ${showCrosshair ? 'active' : ''}`}
                onClick={toggleCrosshair}
              >
                Crosshair
              </button>
              <button 
                className={`toggle-btn ${showRadiological ? 'active' : ''}`}
                onClick={toggleRadiological}
              >
                Radiological
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NiftiViewerAdvanced;
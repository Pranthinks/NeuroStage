import React, { useState, useEffect } from 'react';

const MainPage = ({ setCurrentPage, isAuthenticated, logout }) => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    fetchPublicDatasets();
  }, []);

  const fetchPublicDatasets = async () => {
    try {
      const response = await fetch('/api/public_datasets');
      const data = await response.json();
      if (data.status === 'success') {
        setDatasets(data.datasets);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = () => localStorage.getItem('userName') || 'User';

  const getClassificationLabel = (key) => {
    const labels = {
      'anat': 'T1 AND T2',
      'func': 'BOLD SCANS',
      'dwi': 'DIFFUSION',
      'perf': 'PCASL SCANS',
      'unclassified': 'UNCLASSIFIED'
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

  const baseStyles = `
    .container { min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%); font-family: system-ui, -apple-system, sans-serif; }
    .navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(229, 231, 235, 0.5); padding: 0 2rem; }
    .nav-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; height: 64px; }
    .logo { font-size: 1.5rem; font-weight: bold; color: #1e3a8a; }
    .nav-buttons { display: flex; align-items: center; gap: 1rem; }
    .profile-container { position: relative; }
    .profile-btn { display: flex; align-items: center; gap: 0.5rem; background: #2563eb; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: all 0.2s ease; }
    .profile-btn:hover { background: #1d4ed8; }
    .avatar { width: 32px; height: 32px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 600; }
    .profile-menu { position: absolute; top: 100%; right: 0; background: white; border-radius: 0.75rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; min-width: 200px; margin-top: 0.5rem; padding: 0.5rem 0; z-index: 100; }
    .menu-item { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.75rem 1rem; border: none; background: none; text-align: left; cursor: pointer; font-size: 0.9rem; color: #374151; transition: background-color 0.15s; }
    .menu-item:hover { background: #f9fafb; }
    .menu-item.logout { color: #dc2626; }
    .menu-item.logout:hover { background: #fef2f2; }
    .main-content { padding-top: 64px; }
    .section { padding: 5rem 0; }
    .container-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
    .hero { background: white; text-align: center; }
    .hero h1 { font-size: 3rem; font-weight: bold; color: #111827; margin-bottom: 1.5rem; line-height: 1.1; }
    .hero p { font-size: 1.25rem; color: #6b7280; max-width: 48rem; margin: 0 auto 2rem; line-height: 1.6; }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
    .feature-card { background: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #f3f4f6; transition: all 0.3s; }
    .feature-card:hover { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }
    .feature-icon { width: 48px; height: 48px; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
    .feature-title { font-size: 1.25rem; font-weight: 600; color: #111827; margin-bottom: 1rem; }
    .feature-desc { color: #6b7280; line-height: 1.6; }
    .section-header { text-align: center; margin-bottom: 3rem; }
    .section-title { font-size: 2rem; font-weight: bold; color: #111827; margin-bottom: 1rem; }
    .section-subtitle { color: #6b7280; }
    .loading, .empty-state { text-align: center; padding: 3rem 0; }
    .spinner { display: inline-block; width: 32px; height: 32px; border: 3px solid #f3f4f6; border-top: 3px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .datasets-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; }
    .dataset-card { background: white; border-radius: 1rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #f3f4f6; overflow: hidden; transition: all 0.3s; }
    .dataset-card:hover { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .dataset-content { padding: 1.5rem; }
    .dataset-name { font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 0.5rem; }
    .dataset-desc { font-size: 0.875rem; color: #6b7280; margin-bottom: 1rem; }
    .dataset-meta { font-size: 0.875rem; color: #9ca3af; margin-bottom: 1rem; }
    .dataset-stats { background: #f9fafb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; }
    .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; }
    .stat-row:not(:last-child) { border-bottom: 1px solid #e5e7eb; }
    .stat-label { font-size: 0.875rem; color: #6b7280; font-weight: 500; }
    .stat-value { font-size: 1rem; font-weight: 600; }
    .total-stat { background: white; border-radius: 0.5rem; padding: 0.75rem; margin-bottom: 1rem; text-align: center; }
    .total-number { font-size: 2rem; font-weight: bold; color: #2563eb; display: block; margin-bottom: 0.25rem; }
    .total-label { font-size: 0.875rem; color: #6b7280; }
    .request-btn { width: 100%; background: #2563eb; color: white; border: none; padding: 0.75rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: background 0.2s; }
    .request-btn:hover { background: #1d4ed8; }
    .auth-buttons { display: flex; gap: 0.75rem; }
    .sign-in-btn { color: #6b7280; background: none; border: none; padding: 0.5rem 1rem; font-weight: 500; cursor: pointer; transition: color 0.2s; }
    .sign-in-btn:hover { color: #2563eb; }
    .get-started-btn { background: #2563eb; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: background 0.2s; }
    .get-started-btn:hover { background: #1d4ed8; }
  `;

  const MenuIcon = ({ d }) => <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} /></svg>;

  const FeatureIcon = ({ color, d }) => (
    <div className="feature-icon" style={{background: color}}>
      <svg width="24" height="24" fill="none" stroke={color === '#dbeafe' ? '#2563eb' : color === '#dcfce7' ? '#16a34a' : '#9333ea'} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
      </svg>
    </div>
  );

  return (
    <div className="container">
      <style>{baseStyles}</style>
      
      <nav className="navbar">
        <div className="nav-content">
          <div className="logo">NeuroStage</div>
          <div className="nav-buttons">
            {isAuthenticated ? (
              <div className="profile-container">
                <button className="profile-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                  <div className="avatar">{getUserName().charAt(0).toUpperCase()}</div>
                  <span>{getUserName()}</span>
                  <MenuIcon d="M19 9l-7 7-7-7" />
                </button>
                {showProfileMenu && (
                  <div className="profile-menu">
                    <button className="menu-item" onClick={() => { setCurrentPage('home'); setShowProfileMenu(false); }}>
                      <MenuIcon d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <span>My Dashboard</span>
                    </button>
                    <button className="menu-item" onClick={() => { setCurrentPage('classify'); setShowProfileMenu(false); }}>
                      <MenuIcon d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      <span>View Files</span>
                    </button>
                    <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                    <button className="menu-item logout" onClick={() => { logout(); setShowProfileMenu(false); }}>
                      <MenuIcon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <button className="sign-in-btn" onClick={() => setCurrentPage('login')}>Sign In</button>
                <button className="get-started-btn" onClick={() => setCurrentPage('register')}>Get Started</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="main-content">
        <div className="section hero">
          <div className="container-inner">
            <h1>Complete Neuroimaging Pipeline Platform</h1>
            <p>End-to-end solution for neuroimaging research. Convert DICOM to BIDS format, visualize your data, and run preprocessing workflows—all in one platform. Cloud processing or local deployment for sensitive data.</p>
          </div>
        </div>

        <div className="section">
          <div className="container-inner">
            <div className="features-grid">
              <div className="feature-card">
                <FeatureIcon color="#dbeafe" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                <h3 className="feature-title">DICOM to BIDS Conversion</h3>
                <p className="feature-desc">Automatically convert raw DICOM files to BIDS-compliant format using dcm2niix. Intelligent classification organizes scans into anatomical (T1/T2), functional (BOLD), diffusion (DWI), and perfusion (PCASL) directories.</p>
              </div>
              <div className="feature-card">
                <FeatureIcon color="#dcfce7" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                <h3 className="feature-title">Interactive Visualization</h3>
                <p className="feature-desc">View and explore your converted neuroimaging data directly in the browser. Navigate through slices, adjust contrast, and verify data quality before preprocessing.</p>
              </div>
              <div className="feature-card">
                <FeatureIcon color="#f3e8ff" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                <h3 className="feature-title">Flexible Preprocessing</h3>
                <p className="feature-desc">Run fMRIPrep or custom preprocessing scripts on the cloud. For sensitive data, download our Docker image and run preprocessing locally with complete control over your infrastructure.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="section" style={{background: 'white'}}>
          <div className="container-inner">
            <div className="section-header">
              <h2 className="section-title">Available Datasets</h2>
              <p className="section-subtitle">Explore publicly available datasets from our community</p>
            </div>
            
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p style={{color: '#6b7280', marginTop: '1rem'}}>Loading datasets...</p>
              </div>
            ) : datasets.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style={{margin: '0 auto 1rem'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m7-8v2m0 0V5h2m-2 2h2" />
                </svg>
                <h3 style={{fontSize: '1.125rem', fontWeight: '500', color: '#111827', marginBottom: '0.5rem'}}>No datasets available yet</h3>
                <p style={{color: '#6b7280'}}>Be the first to contribute to our community!</p>
              </div>
            ) : (
              <div className="datasets-grid">
                {datasets.map((dataset) => (
                  <div key={dataset.id} className="dataset-card">
                    <div className="dataset-content">
                      <h3 className="dataset-name">{dataset.name}</h3>
                      <p className="dataset-meta">Uploaded: {new Date(dataset.upload_date * 1000).toLocaleDateString()}</p>
                      
                      <div className="total-stat">
                        <span className="total-number">{dataset.total_files}</span>
                        <span className="total-label">Total Files</span>
                      </div>
                      
                      <div className="dataset-stats">
                        {Object.entries(dataset.classifications || {}).map(([key, count]) => (
                          <div key={key} className="stat-row">
                            <span className="stat-label">{getClassificationLabel(key)}</span>
                            <span className="stat-value" style={{color: getClassificationColor(key)}}>{count}</span>
                          </div>
                        ))}
                      </div>
                      
                      <button className="request-btn" onClick={() => alert('Access request feature coming soon!')}>
                        Request Access
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
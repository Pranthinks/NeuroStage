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

  const getUserName = () => {
    return localStorage.getItem('userName') || 'User';
  };

  return (
    <div>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
        
        .main-wrapper {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);
          padding: 1rem 2rem; box-shadow: 0 2px 20px rgba(0,0,0,0.1);
        }
        
        .nav-content {
          max-width: 1200px; margin: 0 auto;
          display: flex; justify-content: space-between; align-items: center;
        }
        
        .logo { font-size: 1.5rem; font-weight: 700; color: #667eea; }
        .nav-buttons { display: flex; gap: 1rem; align-items: center; position: relative; }
        
        .profile-container { position: relative; }
        .profile-btn {
          background: #667eea; color: white; border: none; padding: 0.5rem 1rem;
          border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
          font-weight: 600; transition: all 0.2s ease;
        }
        .profile-btn:hover { background: #5a67d8; transform: translateY(-1px); }
        
        .profile-menu {
          position: absolute; top: 100%; right: 0; background: white;
          border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          border: 1px solid #e2e8f0; min-width: 200px; z-index: 1000;
          margin-top: 0.5rem; padding: 0.5rem 0;
        }
        
        .profile-menu-item {
          background: none; border: none; padding: 0.75rem 1rem; width: 100%;
          text-align: left; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
          transition: background 0.2s ease; font-size: 0.9rem;
        }
        
        .profile-menu-item:hover { background: #f7fafc; }
        .profile-menu-item.logout { color: #e53e3e; }
        
        .main-container { max-width: 1200px; margin: 0 auto; padding: 120px 2rem 50px; }
        
        .section {
          background: rgba(255, 255, 255, 0.95); border-radius: 24px; padding: 3rem;
          margin-bottom: 3rem; box-shadow: 0 20px 60px rgba(0,0,0,0.1); backdrop-filter: blur(10px);
        }
        
        .hero-section { text-align: center; padding: 4rem; }
        .hero-title { font-size: 3.5rem; font-weight: 800; color: #1a202c; margin-bottom: 1.5rem; }
        .hero-subtitle { font-size: 1.25rem; color: #718096; margin-bottom: 3rem; max-width: 600px; margin-left: auto; margin-right: auto; }
        
        .grid {
          display: grid; gap: 2rem; margin: 2rem 0;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        }
        
        .card {
          background: white; border-radius: 16px; padding: 2rem; border: 1px solid #e2e8f0;
          transition: all 0.3s ease; position: relative; overflow: hidden;
        }
        
        .card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2);
        }
        
        .card:hover { transform: translateY(-4px); box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
        
        .feature-icon {
          width: 64px; height: 64px; background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 16px; display: flex; align-items: center; justify-content: center;
          font-size: 2rem; margin-bottom: 1.5rem;
        }
        
        .card h3 { font-size: 1.5rem; font-weight: 700; color: #1a202c; margin-bottom: 1rem; }
        .card p { color: #4a5568; line-height: 1.6; }
        
        .btn {
          padding: 1rem 2rem; border-radius: 12px; font-size: 1rem; font-weight: 600;
          border: none; cursor: pointer; transition: all 0.3s ease; min-width: 160px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2); color: white;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        
        .btn-secondary {
          background: white; color: #667eea; border: 2px solid #667eea;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        
        .btn:hover { transform: translateY(-2px); }
        .btn-secondary:hover { background: #667eea; color: white; }
        
        .auth-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        
        .section-title {
          font-size: 2.5rem; font-weight: 700; color: #1a202c;
          margin-bottom: 2rem; text-align: center;
        }
        
        .dataset-name { font-size: 1.2rem; font-weight: 600; color: #1a202c; margin-bottom: 0.5rem; }
        .dataset-meta { font-size: 0.9rem; color: #718096; margin-bottom: 1rem; }
        
        .stats {
          display: flex; justify-content: space-between; margin: 1rem 0;
          padding: 0.75rem; background: #f8f9fa; border-radius: 8px;
        }
        
        .stat { text-align: center; }
        .stat-number { font-size: 1.4rem; font-weight: 700; color: #667eea; }
        .stat-label { font-size: 0.8rem; color: #718096; }
        
        .tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
        .tag {
          background: #e6f3ff; color: #0066cc; padding: 0.25rem 0.75rem;
          border-radius: 12px; font-size: 0.8rem; font-weight: 500;
        }
        
        .request-btn {
          width: 100%; background: linear-gradient(135deg, #667eea, #764ba2); color: white;
          border: none; padding: 0.75rem; border-radius: 8px; font-size: 0.9rem;
          font-weight: 600; cursor: pointer; transition: all 0.2s ease;
        }
        
        .request-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3); }
        
        .loading, .no-data { text-align: center; padding: 2rem; color: #718096; font-size: 1.1rem; }
        
        @media (max-width: 768px) {
          .main-container { padding: 100px 1rem 30px; }
          .section { padding: 2rem 1.5rem; }
          .hero-section { padding: 2.5rem 1.5rem; }
          .hero-title { font-size: 2.5rem; }
          .section-title { font-size: 2rem; }
          .grid { grid-template-columns: 1fr; }
          .auth-buttons { flex-direction: column; align-items: center; }
        }
      `}</style>
      
      <div className="main-wrapper">
        <nav className="navbar">
          <div className="nav-content">
            <div className="logo">MedScan Pro</div>
            <div className="nav-buttons">
              {isAuthenticated ? (
                <div className="profile-container">
                  <button 
                    className="profile-btn" 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                  >
                    👤 {getUserName()}
                  </button>
                  {showProfileMenu && (
                    <div className="profile-menu">
                      <button 
                        className="profile-menu-item" 
                        onClick={() => { setCurrentPage('home'); setShowProfileMenu(false); }}
                      >
                        🏠 My Dashboard
                      </button>
                      <button 
                        className="profile-menu-item" 
                        onClick={() => { setCurrentPage('classify'); setShowProfileMenu(false); }}
                      >
                        🏷️ Classify Files
                      </button>
                      <hr style={{margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e2e8f0'}} />
                      <button 
                        className="profile-menu-item logout" 
                        onClick={() => { logout(); setShowProfileMenu(false); }}
                      >
                        🚪 Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={() => setCurrentPage('login')}>Sign In</button>
                  <button className="btn btn-primary" onClick={() => setCurrentPage('register')}>Get Started</button>
                </>
              )}
            </div>
          </div>
        </nav>

        <div className="main-container">
          <div className="section hero-section">
            <h1 className="hero-title">Medical Image Processing Platform</h1>
            <p className="hero-subtitle">
              Transform your DICOM files into NIfTI format and automatically classify them by scan type. 
              Built for researchers and medical professionals.
            </p>
          </div>
          
          <div className="section">
            <div className="grid">
              <div className="card">
                <div className="feature-icon">🔄</div>
                <h3>DICOM to NIfTI Conversion</h3>
                <p>Seamlessly convert DICOM images to NIfTI format using industry-standard dcm2niix tools. Batch processing support for efficient workflow.</p>
              </div>
              <div className="card">
                <div className="feature-icon">🧠</div>
                <h3>AI-Powered Classification</h3>
                <p>Intelligent classification system that automatically categorizes scans into T1, T2, Diffusion, and PCASL based on metadata analysis.</p>
              </div>
              <div className="card">
                <div className="feature-icon">📊</div>
                <h3>Organized Data Management</h3>
                <p>Automatic file organization with detailed reporting and easy access to processed data. Keep your research organized and accessible.</p>
              </div>
            </div>
          </div>

          <div className="section">
            <h2 className="section-title">Available Datasets</h2>
            {loading ? (
              <div className="loading">Loading datasets...</div>
            ) : datasets.length === 0 ? (
              <div className="no-data">No public datasets available yet. Be the first to contribute!</div>
            ) : (
              <div className="grid">
                {datasets.map((dataset) => (
                  <div key={dataset.id} className="card">
                    <div className="dataset-name">{dataset.name}</div>
                    <div className="dataset-meta">
                      Uploaded: {new Date(dataset.upload_date * 1000).toLocaleDateString()}
                    </div>
                    <div className="stats">
                      <div className="stat">
                        <div className="stat-number">{dataset.total_files}</div>
                        <div className="stat-label">Files</div>
                      </div>
                      <div className="stat">
                        <div className="stat-number">
                          {Object.values(dataset.classifications).reduce((a, b) => a + b, 0)}
                        </div>
                        <div className="stat-label">Classified</div>
                      </div>
                    </div>
                    {dataset.has_classification && (
                      <div className="tags">
                        {Object.entries(dataset.classifications)
                          .filter(([_, count]) => count > 0)
                          .map(([type, count]) => (
                            <div key={type} className="tag">
                              {type.replace('_scans', '').toUpperCase()} ({count})
                            </div>
                          ))
                        }
                      </div>
                    )}
                    <button className="request-btn" onClick={() => setCurrentPage('login')}>
                      Login to Request Access
                    </button>
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
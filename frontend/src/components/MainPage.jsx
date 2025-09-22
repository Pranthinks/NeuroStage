import React from 'react';

const MainPage = ({ setCurrentPage }) => {
  return (
    <div>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          line-height: 1.6;
          color: #2d3748;
          background: #f7fafc;
        }
        
        .main-wrapper {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 1rem 2rem;
          z-index: 100;
          box-shadow: 0 2px 20px rgba(0,0,0,0.1);
        }
        
        .nav-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
        }
        
        .nav-buttons {
          display: flex;
          gap: 1rem;
        }
        
        .main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 120px 2rem 50px;
        }
        
        .hero-section {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 24px;
          padding: 4rem;
          margin-bottom: 3rem;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
        }
        
        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          color: #1a202c;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }
        
        .hero-subtitle {
          font-size: 1.25rem;
          color: #718096;
          margin-bottom: 3rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin: 3rem 0;
        }
        
        .feature-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 2.5rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2);
        }
        
        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 70px rgba(0,0,0,0.15);
        }
        
        .feature-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin-bottom: 1.5rem;
        }
        
        .feature-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 1rem;
        }
        
        .feature-description {
          color: #4a5568;
          line-height: 1.6;
        }
        
        .auth-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .btn {
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 160px;
          justify-content: center;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        
        .btn-secondary:hover {
          background: #667eea;
          color: white;
          transform: translateY(-2px);
        }
        
        @media (max-width: 768px) {
          .main-container {
            padding: 100px 1rem 30px;
          }
          
          .hero-section {
            padding: 2.5rem 1.5rem;
          }
          
          .hero-title {
            font-size: 2.5rem;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
          }
          
          .auth-buttons {
            flex-direction: column;
            align-items: center;
          }
          
          .nav-content {
            padding: 0 1rem;
          }
        }
      `}</style>
      
      <div className="main-wrapper">
        <nav className="navbar">
          <div className="nav-content">
            <div className="logo">MedScan Pro</div>
            <div className="nav-buttons">
              <button className="btn btn-secondary" onClick={() => setCurrentPage('login')}>
                Sign In
              </button>
              <button className="btn btn-primary" onClick={() => setCurrentPage('register')}>
                Get Started
              </button>
            </div>
          </div>
        </nav>

        <div className="main-container">
          <div className="hero-section">
            <h1 className="hero-title">Medical Image Processing Platform</h1>
            <p className="hero-subtitle">
              Transform your DICOM files into NIfTI format and automatically classify them by scan type. 
              Built for researchers and medical professionals.
            </p>
            
            <div className="auth-buttons">
              <button className="btn btn-primary" onClick={() => setCurrentPage('register')}>
                Register
              </button>
              <button className="btn btn-secondary" onClick={() => setCurrentPage('login')}>
                Sign In
              </button>
            </div>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3 className="feature-title">DICOM to NIfTI Conversion</h3>
              <p className="feature-description">
                Seamlessly convert DICOM images to NIfTI format using industry-standard dcm2niix tools. 
                Batch processing support for efficient workflow.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3 className="feature-title">AI-Powered Classification</h3>
              <p className="feature-description">
                Intelligent classification system that automatically categorizes scans into T1, T2, 
                Diffusion, and PCASL based on metadata analysis.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Organized Data Management</h3>
              <p className="feature-description">
                Automatic file organization with detailed reporting and easy access to processed data. 
                Keep your research organized and accessible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
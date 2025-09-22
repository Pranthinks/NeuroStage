import React, { useState } from 'react';

const RegisterPage = ({ setCurrentPage, setIsAuthenticated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Simple demo registration - in real app, call your backend
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', formData.email);
    localStorage.setItem('userName', formData.name);
    setIsAuthenticated(true);
    setCurrentPage('home');
  };

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
          background: #f8fafc;
          color: #2d3748;
        }
        
        .auth-wrapper {
          min-height: 100vh;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        
        .auth-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 3rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          max-width: 450px;
          width: 100%;
          position: relative;
        }
        
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .auth-title {
          font-size: 2rem;
          font-weight: 800;
          color: #1a202c;
          margin-bottom: 0.5rem;
        }
        
        .auth-subtitle {
          color: #718096;
          font-size: 1rem;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          color: #4a5568;
          font-weight: 600;
          font-size: 0.9rem;
        }
        
        .form-input {
          width: 100%;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: #f7fafc;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #28a745;
          background: white;
          box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
        }
        
        .error-message {
          background: #fed7d7;
          border: 1px solid #feb2b2;
          color: #742a2a;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          text-align: center;
          font-weight: 600;
        }
        
        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 1.5rem;
        }
        
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(40, 167, 69, 0.4);
        }
        
        .auth-links {
          text-align: center;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }
        
        .link-btn {
          background: none;
          border: none;
          color: #28a745;
          font-size: 0.9rem;
          cursor: pointer;
          text-decoration: underline;
          margin: 0.25rem;
          padding: 0.5rem;
        }
        
        .link-btn:hover {
          color: #1e7e34;
        }
        
        .back-btn {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: rgba(255, 255, 255, 0.8);
          border: none;
          border-radius: 8px;
          padding: 0.5rem;
          cursor: pointer;
          color: #4a5568;
          transition: all 0.2s ease;
        }
        
        .back-btn:hover {
          background: white;
          color: #2d3748;
        }
        
        .password-hint {
          font-size: 0.8rem;
          color: #718096;
          margin-top: 0.25rem;
        }
        
        @media (max-width: 480px) {
          .auth-wrapper {
            padding: 1rem;
          }
          
          .auth-container {
            padding: 2rem 1.5rem;
          }
          
          .auth-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
      
      <div className="auth-wrapper">
        <div className="auth-container">
          <button className="back-btn" onClick={() => setCurrentPage('main')}>
            ← Back
          </button>
          
          <div className="auth-header">
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Join MedScan Pro today</p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
              />
              <div className="password-hint">Must be at least 6 characters</div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
              />
            </div>
            
            <button type="submit" className="submit-btn">
              Create Account
            </button>
          </form>
          
          <div className="auth-links">
            <button className="link-btn" onClick={() => setCurrentPage('login')}>
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
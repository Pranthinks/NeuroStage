import React, { useState } from 'react';

const LoginPage = ({ setCurrentPage, setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      // Call backend login API
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Store user data and authenticate
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', data.user.name);
        setIsAuthenticated(true);
        setCurrentPage('home');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Login failed. Please try again.');
      console.error('Login error:', error);
    }
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        
        .demo-info {
          background: linear-gradient(135deg, #e6fffa, #b2f5ea);
          border: 1px solid #81e6d9;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .demo-info strong {
          color: #234e52;
          display: block;
          margin-bottom: 0.5rem;
        }
        
        .demo-credentials {
          font-family: monospace;
          font-size: 0.9rem;
          color: #2d5a5d;
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
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
          background: linear-gradient(135deg, #667eea, #764ba2);
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
          box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
        }
        
        .auth-links {
          text-align: center;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }
        
        .link-btn {
          background: none;
          border: none;
          color: #667eea;
          font-size: 0.9rem;
          cursor: pointer;
          text-decoration: underline;
          margin: 0.25rem;
          padding: 0.5rem;
        }
        
        .link-btn:hover {
          color: #5a67d8;
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
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Sign in to your account</p>
          </div>
          
          <div className="demo-info">
            <strong>Demo Account</strong>
            <div className="demo-credentials">
              Email: demo@demo.com<br/>
              Password: demo123
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            
            <button type="submit" className="submit-btn">
              Sign In
            </button>
          </form>
          
          <div className="auth-links">
            <button className="link-btn" onClick={() => setCurrentPage('register')}>
              Don't have an account? Create one
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
import React, { useState, useEffect } from 'react';
import MainPage from './components/MainPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import HomePage from './components/HomePage';
import ClassifyPage from './components/ClassifyPage';

const App = () => {
  const [currentPage, setCurrentPage] = useState('main');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
    
  useEffect(() => {
    // Check if user is already logged in
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      setCurrentPage('home');
    }
  }, []);
    
  const logout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setCurrentPage('main');
  };
    
  // Protected route check - only for truly protected pages
  if ((currentPage === 'home' || currentPage === 'classify') && !isAuthenticated) {
    setCurrentPage('login');
  }
  // Main page is accessible to both logged-in and logged-out users
    
  return (
    <div>
      {currentPage === 'main' && <MainPage setCurrentPage={setCurrentPage} isAuthenticated={isAuthenticated} logout={logout} />}
      {currentPage === 'login' && <LoginPage setCurrentPage={setCurrentPage} setIsAuthenticated={setIsAuthenticated} />}
      {currentPage === 'register' && <RegisterPage setCurrentPage={setCurrentPage} setIsAuthenticated={setIsAuthenticated} />}
      {currentPage === 'home' && <HomePage setCurrentPage={setCurrentPage} logout={logout} />}
      {currentPage === 'classify' && <ClassifyPage setCurrentPage={setCurrentPage} logout={logout} />}
    </div>
  );
};

export default App;
import { useState, useEffect } from 'react';
import Login from './Login';
import DashboardUser from './DashboardUser';
import DashboardDelivery from './DashboardDelivery';
import DashboardBunk from './DashboardBunk';
import DashboardAdmin from './DashboardAdmin';

import './App.css'

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [userData, setUserData] = useState(null);
  
  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const storedUserType = localStorage.getItem('userType');
    const storedUserData = localStorage.getItem('userData');
    
    if (token && storedUserType && storedUserData) {
      setAuthenticated(true);
      setUserType(storedUserType);
      try {
        setUserData(JSON.parse(storedUserData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        handleLogout(); // Invalid data, log out
      }
    }
  }, []);
  
  // Handle successful login
  const handleLoginSuccess = (type, user) => {
    setAuthenticated(true);
    setUserType(type);
    setUserData(user);
  };
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    setAuthenticated(false);
    setUserType(null);
    setUserData(null);
  };

  return (
    <>
      {!authenticated ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : userType === 'user' ? (
        <DashboardUser user={userData} onLogout={handleLogout} />
      ) : userType === 'delivery' ? (
        <DashboardDelivery user={userData} onLogout={handleLogout} />
      ) : userType === 'bunk' ? (
        <DashboardBunk user={userData} onLogout={handleLogout} />
      ) : userType === 'admin' ? (
        <DashboardAdmin user={userData} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

export default App;
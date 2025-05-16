import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bunkName, setBunkName] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [mode, setMode] = useState('login');
  const [userType, setUserType] = useState('user');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Set default location (India)
  const setIndiaLocation = () => {
    setLat(28.6139);
    setLng(77.2090);
  };

  // Get current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError(`Failed to get your location: ${error.message}`);
        setLocationLoading(false);
        setIndiaLocation(); // Fallback to default location
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Set default location when component mounts
  useEffect(() => {
    if (mode === 'register' && (userType === 'user' || userType === 'bunk') && !lat && !lng) {
      setIndiaLocation();
    }
  }, [mode, userType, lat, lng]);

  // Initialize map when coordinates change
  useEffect(() => {
    if ((mode === 'register') && (userType === 'user' || userType === 'bunk') && lat && lng && mapRef.current) {
      // Remove existing map instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Create new map
      const map = L.map(mapRef.current).setView([lat, lng], 13);
      mapInstanceRef.current = map;
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add draggable marker
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current = marker;
      
      // Update coordinates on marker drag
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setLat(position.lat);
        setLng(position.lng);
      });

      // Clean up on unmount
      return () => {
        if (map) {
          map.remove();
          mapInstanceRef.current = null;
          markerRef.current = null;
        }
      };
    }
  }, [lat, lng, mode, userType]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Form validation
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    // Location validation for user and bunk registration
    if (mode === 'register') {
      if ((userType === 'user' || userType === 'bunk') && (!lat || !lng)) {
        setError('Please set your location');
        return;
      }
      
      if (userType === 'bunk' && !bunkName) {
        setError('Please enter a bunk name');
        return;
      }
      
      if (userType === 'bunk' && !location) {
        setError('Please enter a location description');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      let endpoint, payload;
      
      // Determine endpoint and payload based on mode and user type
      if (mode === 'register') {
        switch (userType) {
          case 'user':
            endpoint = '/register';
            payload = { username, password, lat, lng };
            break;
          case 'delivery':
            endpoint = '/register-delivery';
            payload = { username, password };
            break;
          case 'bunk':
            endpoint = '/register-bunk';
            payload = { username, password, bunkName, location, lat, lng };
            break;
          case 'admin':
            setError('Admin accounts cannot be registered');
            setLoading(false);
            return;
          default:
            endpoint = '/register';
            payload = { username, password };
        }
      } else { // Login mode
        switch (userType) {
          case 'user':
            endpoint = '/login';
            break;
          case 'delivery':
            endpoint = '/login-delivery';
            break;
          case 'bunk':
            endpoint = '/login-bunk';
            break;
          case 'admin':
            endpoint = '/login-admin';
            break;
          default:
            endpoint = '/login';
        }
        payload = { username, password };
      }
      
      // Send request to server
      const response = await axios.post(`http://localhost:5000${endpoint}`, payload);
      
      if (response.data.success) {
        if (mode === 'login') {
          // Store tokens and user data
          localStorage.setItem('userToken', response.data.token);
          localStorage.setItem('userType', userType);
          localStorage.setItem('userData', JSON.stringify(response.data.user));
          
          // Notify parent component
          onLoginSuccess(userType, response.data.user);
        } else {
          // Switch to login mode after successful registration
          setMode('login');
          alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} registered successfully! You can now login.`);
          // Clear form for registration
          setPassword('');
          setBunkName('');
          setLocation('');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle user type switch
  const handleUserTypeSwitch = (type) => {
    setUserType(type);
    setError(null); // Clear any previous errors
  };

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7 col-sm-9">
          <div className="card shadow-lg mt-5">
            <div className="card-header bg-primary text-white text-center py-3">
              <h2 className="mb-0">⛽ RefuelX</h2>
              <p className="mb-0">Fuel Delivery Solution</p>
            </div>
            
            <div className="card-body p-4">
              {/* User Type Selector */}
              <div className="user-type-toggle mb-4">
                <h5 className="text-center mb-2">I am a:</h5>
                <div className="d-flex flex-wrap gap-2">
                  <button 
                    type="button"
                    className={`btn ${userType === 'user' ? 'btn-primary' : 'btn-outline-primary'} flex-grow-1`}
                    onClick={() => handleUserTypeSwitch('user')}
                    disabled={loading}
                  >
                    <i className="bi bi-person-fill me-2"></i>
                    Customer
                  </button>
                  <button 
                    type="button"
                    className={`btn ${userType === 'delivery' ? 'btn-success' : 'btn-outline-success'} flex-grow-1`}
                    onClick={() => handleUserTypeSwitch('delivery')}
                    disabled={loading}
                  >
                    <i className="bi bi-truck me-2"></i>
                    Delivery
                  </button>
                  <button 
                    type="button"
                    className={`btn ${userType === 'bunk' ? 'btn-info' : 'btn-outline-info'} flex-grow-1`}
                    onClick={() => handleUserTypeSwitch('bunk')}
                    disabled={loading}
                  >
                    <i className="bi bi-fuel-pump me-2"></i>
                    Bunk
                  </button>
                  <button 
                    type="button"
                    className={`btn ${userType === 'admin' ? 'btn-dark' : 'btn-outline-dark'} flex-grow-1`}
                    onClick={() => handleUserTypeSwitch('admin')}
                    disabled={loading}
                  >
                    <i className="bi bi-shield-lock me-2"></i>
                    Admin
                  </button>
                </div>
              </div>
              
              {/* Toggle between Login and Register */}
              <div className="mode-toggle mb-4">
                <div className="btn-group w-100">
                  <button 
                    type="button"
                    className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setMode('login')}
                    disabled={loading}
                  >
                    Login
                  </button>
                  <button 
                    type="button"
                    className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setMode('register')}
                    disabled={loading || userType === 'admin'}
                  >
                    Register
                  </button>
                </div>
              </div>
              
              {/* Error Display */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              {/* Login/Register Form */}
              <form onSubmit={handleSubmit}>
                {/* Username field */}
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                {/* Password field */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                {/* Bunk-specific fields for registration */}
                {mode === 'register' && userType === 'bunk' && (
                  <>
                    <div className="mb-3">
                      <label htmlFor="bunkName" className="form-label">Bunk Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="bunkName"
                        value={bunkName}
                        onChange={(e) => setBunkName(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="location" className="form-label">Location Description</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="location"
                        placeholder="e.g., Highway 66, Chennai"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </>
                )}
                
                {/* Location Map for user and bunk registration */}
                {mode === 'register' && (userType === 'user' || userType === 'bunk') && (
                  <div className="mb-3">
                    <label className="form-label">
                      {userType === 'user' ? 'Your Location' : 'Bunk Location'}
                    </label>
                    <div className="d-flex gap-2 mb-2">
                      <button 
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={getCurrentLocation}
                        disabled={loading || locationLoading}
                      >
                        {locationLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Detecting...
                          </>
                        ) : (
                          'Detect Location'
                        )}
                      </button>
                      <button 
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={setIndiaLocation}
                        disabled={loading}
                      >
                        Set to India
                      </button>
                    </div>
                    
                    <div 
                      ref={mapRef} 
                      style={{ height: '300px', borderRadius: '4px', marginBottom: '10px' }}
                    ></div>
                    
                    <small className="text-muted">
                      Drag the marker to adjust your location. Current coordinates: 
                      {lat && lng ? ` ${lat.toFixed(6)}, ${lng.toFixed(6)}` : ' Not set'}
                    </small>
                  </div>
                )}
                
                {/* Submit Button */}
                <div className="d-grid gap-2">
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {mode === 'login' ? 'Logging in...' : 'Registering...'}
                      </>
                    ) : (
                      mode === 'login' ? 'Login' : 'Register'
                    )}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="card-footer text-center text-muted">
              <small>© 2025 RefuelX. All rights reserved.</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
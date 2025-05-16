import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';

function DashboardBunk({ user, onLogout }) {
  const [fuelPrices, setFuelPrices] = useState({
    petrol: 100.50,
    diesel: 90.20,
    gas: 85.50
  });
  
  const [fuelInventory, setFuelInventory] = useState({
    petrol: 5000,
    diesel: 5000,
    gas: 1000
  });
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState(null);
  
  // Fetch data on component mount
  useEffect(() => {
    fetchBunkData();
    fetchRequests();
  }, []);
  
  // Fetch bunk details
  const fetchBunkData = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('No auth token found');
      }
      
      const response = await axios.get('http://localhost:5000/bunk/details', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setFuelPrices(response.data.prices);
        setFuelInventory(response.data.inventory);
      }
    } catch (error) {
      console.error('Error fetching bunk data:', error);
      setError(`Failed to load bunk data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch nearby requests
  const fetchRequests = async () => {
    try {
      setRequestLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('No auth token found');
      }
      
      const response = await axios.get('http://localhost:5000/bunk/requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setRequests(response.data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      // Don't show an alert for this error, just log it
    } finally {
      setRequestLoading(false);
    }
  };
  
  // Update fuel prices
  const handleUpdatePrices = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('userToken');
      
      const response = await axios.post('http://localhost:5000/bunk/update-prices', 
        { prices: fuelPrices },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert('Fuel prices updated successfully');
      }
    } catch (error) {
      console.error('Error updating prices:', error);
      alert(`Failed to update prices: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Update inventory
  const handleUpdateInventory = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('userToken');
      
      const response = await axios.post('http://localhost:5000/bunk/update-inventory', 
        { inventory: fuelInventory },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert('Inventory updated successfully');
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert(`Failed to update inventory: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Approve request
  const handleApproveRequest = async (requestId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      
      const response = await axios.put(
        `http://localhost:5000/fuel-request/${requestId}/approve`, 
        {}, 
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        alert(`Request approved successfully! ${
          response.data.deliveryOptions > 0 
            ? `${response.data.deliveryOptions} delivery personnel available.` 
            : 'No delivery personnel currently available, but they will be notified.'
        }`);
        
        // Refresh the requests list
        fetchRequests();
      }
    } catch (error) {
      console.error('Error approving request:', error);
      let errorMessage = 'Failed to approve request.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Dashboard tab content
  const renderDashboard = () => (
    <>
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card text-white bg-primary h-100">
            <div className="card-header">
              <h5 className="mb-0">Petrol</h5>
            </div>
            <div className="card-body">
              <h2 className="card-title">{formatCurrency(fuelPrices.petrol)}/L</h2>
              <p className="card-text">Inventory: {fuelInventory.petrol} Liters</p>
              <div className="progress">
                <div 
                  className="progress-bar bg-light" 
                  style={{ width: `${Math.min((fuelInventory.petrol / 10000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card text-white bg-success h-100">
            <div className="card-header">
              <h5 className="mb-0">Diesel</h5>
            </div>
            <div className="card-body">
              <h2 className="card-title">{formatCurrency(fuelPrices.diesel)}/L</h2>
              <p className="card-text">Inventory: {fuelInventory.diesel} Liters</p>
              <div className="progress">
                <div 
                  className="progress-bar bg-light" 
                  style={{ width: `${Math.min((fuelInventory.diesel / 10000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card text-white bg-warning h-100">
            <div className="card-header">
              <h5 className="mb-0">Gas</h5>
            </div>
            <div className="card-body">
              <h2 className="card-title">{formatCurrency(fuelPrices.gas)}/Kg</h2>
              <p className="card-text">Inventory: {fuelInventory.gas} Kg</p>
              <div className="progress">
                <div 
                  className="progress-bar bg-light" 
                  style={{ width: `${Math.min((fuelInventory.gas / 2000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Update Fuel Prices</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleUpdatePrices}>
                <div className="mb-3">
                  <label htmlFor="petrolPrice" className="form-label">Petrol Price (₹/Liter)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control" 
                    id="petrolPrice"
                    value={fuelPrices.petrol}
                    onChange={(e) => setFuelPrices({...fuelPrices, petrol: parseFloat(e.target.value)})}
                    min="1"
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="dieselPrice" className="form-label">Diesel Price (₹/Liter)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control" 
                    id="dieselPrice"
                    value={fuelPrices.diesel}
                    onChange={(e) => setFuelPrices({...fuelPrices, diesel: parseFloat(e.target.value)})}
                    min="1"
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="gasPrice" className="form-label">Gas Price (₹/Kg)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control" 
                    id="gasPrice"
                    value={fuelPrices.gas}
                    onChange={(e) => setFuelPrices({...fuelPrices, gas: parseFloat(e.target.value)})}
                    min="1"
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Prices'}
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Update Inventory</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleUpdateInventory}>
                <div className="mb-3">
                  <label htmlFor="petrolInventory" className="form-label">Petrol Inventory (Liters)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    id="petrolInventory"
                    value={fuelInventory.petrol}
                    onChange={(e) => setFuelInventory({...fuelInventory, petrol: parseInt(e.target.value)})}
                    min="0"
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="dieselInventory" className="form-label">Diesel Inventory (Liters)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    id="dieselInventory"
                    value={fuelInventory.diesel}
                    onChange={(e) => setFuelInventory({...fuelInventory, diesel: parseInt(e.target.value)})}
                    min="0"
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="gasInventory" className="form-label">Gas Inventory (Kg)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    id="gasInventory"
                    value={fuelInventory.gas}
                    onChange={(e) => setFuelInventory({...fuelInventory, gas: parseInt(e.target.value)})}
                    min="0"
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-success" 
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Inventory'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
  
  // Requests tab content
  const renderRequests = () => (
    <div className="card">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">Nearby Fuel Requests</h5>
      </div>
      <div className="card-body">
        {requests.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted mb-0">No pending fuel requests in your area</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Fuel Type</th>
                  <th>Quantity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request._id}>
                    <td>{formatDate(request.createdAt)}</td>
                    <td>{request.userId?.username || 'Unknown'}</td>
                    <td className="text-capitalize">{request.fuelType}</td>
                    <td>
                      {request.quantity} {request.fuelType === 'gas' ? 'Kg' : 'L'}
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => handleApproveRequest(request._id)}
                        disabled={requestLoading}
                      >
                        {requestLoading ? 'Approving...' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="text-center mt-3">
          <button 
            className="btn btn-outline-primary" 
            onClick={fetchRequests} 
            disabled={loading}
          >
            Refresh Requests
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="dashboard-container">
      <Navbar userType="bunk" onLogout={onLogout} />
      
      <div className="container py-4">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-0">{user?.bunkName || 'Bunk'} Dashboard</h2>
                <p className="text-muted">{user?.location || 'Location not available'}</p>
              </div>
              
              <div className="btn-group">
                <button 
                  className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  Dashboard
                </button>
                <button 
                  className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveTab('requests')}
                >
                  Requests
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {loading && !error ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading bunk data...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">
            {error}
            <button 
              className="btn btn-outline-danger mt-2"
              onClick={() => {
                setError(null);
                fetchBunkData();
              }}
            >
              Try Again
            </button>
          </div>
        ) : (
          activeTab === 'dashboard' ? renderDashboard() : renderRequests()
        )}
      </div>
    </div>
  );
}

export default DashboardBunk;
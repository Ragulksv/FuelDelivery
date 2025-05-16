import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function DashboardDelivery({ user, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [mapError, setMapError] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  useEffect(() => {
    fetchRequests();
    fetchMyDeliveries();
  }, []);

  useEffect(() => {
    if (!activeRequest || !activeRequest.lat || !activeRequest.lng || !mapContainerRef.current) {
      return;
    }
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          console.error("Error removing previous map:", err);
        }
        mapInstanceRef.current = null;
      }
      
      try {
        // Create new map centered on request location
        const map = L.map(mapContainerRef.current).setView([activeRequest.lat, activeRequest.lng], 15);
        mapInstanceRef.current = map;
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        L.marker([activeRequest.lat, activeRequest.lng])
          .addTo(map)
          .bindPopup('Delivery Location')
          .openPopup();
          
        setTimeout(() => {
          if (map && mapContainerRef.current) {
            map.invalidateSize();
          }
        }, 300);
        
        // Clear any previous errors
        setMapError(null);
      } catch (error) {
        console.error("Error initializing map:", error);
        setMapError("Failed to load map. Please try again.");
      }
    }, 500); 
    
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          console.error("Error cleaning up map:", err);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [activeRequest]);

  // Fetch pending fuel requests
  const fetchRequests = async () => {
    if (!localStorage.getItem('userToken')) {
      return; // Don't attempt request without token
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get('http://localhost:5000/fuel-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Ensure we have an array even if API returns null/undefined
      setRequests(response.data?.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch my assigned deliveries
  const fetchMyDeliveries = async () => {
    if (!localStorage.getItem('userToken')) {
      return; // Don't attempt request without token
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get('http://localhost:5000/my-deliveries', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Ensure we have an array even if API returns null/undefined
      setMyDeliveries(response.data?.requests || []);
    } catch (error) {
      console.error('Error fetching my deliveries:', error);
      alert('Failed to load your assigned deliveries');
    } finally {
      setLoading(false);
    }
  };
  
  // Accept a fuel request
  const handleAcceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('userToken');
      await axios.put(`http://localhost:5000/fuel-request/${requestId}`, {
        status: 'accepted'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      alert('Request accepted successfully!');
      
      // Refresh both lists
      fetchRequests();
      fetchMyDeliveries();
      
    } catch (error) {
      console.error('Error accepting request:', error);
      alert(error.response?.data?.message || 'Failed to accept request');
    }
  };
  
  // Update delivery status
  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const token = localStorage.getItem('userToken');
      await axios.put(`http://localhost:5000/fuel-request/${requestId}`, {
        status: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      alert(`Status updated to: ${newStatus}`);
      
      // Refresh both lists
      fetchRequests();
      fetchMyDeliveries();
      
      // If the updated request is the active one, update it
      if (activeRequest && activeRequest._id === requestId) {
        setActiveRequest({...activeRequest, status: newStatus});
      }
      
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };
  
  // View request details and location
  const handleViewRequest = (request) => {
    setActiveRequest(request);
  };

  // Open location in Google Maps
  const openInGoogleMaps = () => {
    if (!activeRequest || !activeRequest.lat || !activeRequest.lng) return;
    
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${activeRequest.lat},${activeRequest.lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending': return 'bg-warning';
      case 'accepted': return 'bg-info';
      case 'in-transit': return 'bg-primary';
      case 'delivered': return 'bg-success';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status options based on current status
  const getNextStatusOptions = (currentStatus) => {
    switch(currentStatus) {
      case 'accepted':
        return ['in-transit', 'cancelled'];
      case 'in-transit':
        return ['delivered', 'cancelled'];
      default:
        return [];
    }
  };

  const getUserName = (request) => {
    return request?.userId?.username || 'Unknown';
  };

  return (
    <div className="dashboard-container">
      <Navbar userType="delivery" onLogout={onLogout} />
      
      <div className="container py-4">
        <div className="row">
          {/* Left column - Request List */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Pending Requests</h5>
              </div>
              <div className="card-body">
                {loading ? (
                  <p className="text-center my-4">Loading requests...</p>
                ) : !requests || requests.length === 0 ? (
                  <p className="text-center my-4">No pending fuel requests at the moment.</p>
                ) : (
                  <div className="list-group">
                    {requests.map(request => (
                      <div key={request._id} className="list-group-item list-group-item-action">
                        <div className="d-flex w-100 justify-content-between">
                          <h6 className="mb-1">
                            Order #{request._id}
                          </h6>
                          <small>{formatDate(request.createdAt)}</small>
                        </div>
                        <p className="mb-1">
                          <span className="text-capitalize">{request.fuelType}</span> - {request.quantity} Liters
                        </p>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            Customer: {getUserName(request)}
                          </small>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleViewRequest(request)}
                            >
                              View
                            </button>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleAcceptRequest(request._id)}
                            >
                              Accept
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="d-grid gap-2 mt-3">
                  <button 
                    className="btn btn-outline-primary" 
                    onClick={fetchRequests}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh Requests
                  </button>
                </div>
              </div>
            </div>
            
            <div className="card shadow-sm">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">My Deliveries</h5>
              </div>
              <div className="card-body">
                {loading ? (
                  <p className="text-center my-4">Loading your deliveries...</p>
                ) : !myDeliveries || myDeliveries.length === 0 ? (
                  <p className="text-center my-4">You don't have any assigned deliveries yet.</p>
                ) : (
                  <div className="list-group">
                    {myDeliveries.map(delivery => (
                      <div key={delivery._id} className="list-group-item list-group-item-action">
                        <div className="d-flex w-100 justify-content-between">
                          <h6 className="mb-1">
                            Order #{delivery._id}
                          </h6>
                          <span className={`badge ${getStatusBadgeClass(delivery.status)}`}>
                            {delivery.status}
                          </span>
                        </div>
                        <p className="mb-1">
                          <span className="text-capitalize">{delivery.fuelType}</span> - {delivery.quantity} Liters
                        </p>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            Customer: {getUserName(delivery)}
                          </small>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleViewRequest(delivery)}
                            >
                              View
                            </button>
                            <div className="dropdown">
                              <button 
                                className="btn btn-sm btn-outline-success dropdown-toggle" 
                                type="button" 
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                Update Status
                              </button>
                              <ul className="dropdown-menu">
                                {getNextStatusOptions(delivery.status).map(status => (
                                  <li key={status}>
                                    <button 
                                      className="dropdown-item" 
                                      onClick={() => handleUpdateStatus(delivery._id, status)}
                                    >
                                      {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right column - Selected Request Details and Map */}
          <div className="col-md-6">
            <div className="card shadow-sm">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">Request Details</h5>
              </div>
              {activeRequest ? (
                <div className="card-body">
                  <h5 className="card-title">Order #{activeRequest._id}</h5>
                  <div className="row mb-3">
                    <div className="col-sm-6">
                      <p className="mb-1"><strong>Fuel Type:</strong></p>
                      <p className="text-capitalize">{activeRequest.fuelType}</p>
                    </div>
                    <div className="col-sm-6">
                      <p className="mb-1"><strong>Quantity:</strong></p>
                      <p>{activeRequest.quantity} Liters</p>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-sm-6">
                      <p className="mb-1"><strong>Price:</strong></p>
                      <p>₹{activeRequest.price.toFixed(2)}</p>
                    </div>
                    <div className="col-sm-6">
                      <p className="mb-1"><strong>Status:</strong></p>
                      <p>
                        <span className={`badge ${getStatusBadgeClass(activeRequest.status)}`}>
                          {activeRequest.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-sm-6">
                      <p className="mb-1"><strong>Customer:</strong></p>
                      <p>{getUserName(activeRequest)}</p>
                    </div>
                    <div className="col-sm-6">
                      <p className="mb-1"><strong>Created:</strong></p>
                      <p>{formatDate(activeRequest.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <p className="mb-1"><strong>Delivery Location:</strong></p>
                      <button 
                        className="btn btn-sm btn-outline-info"
                        onClick={openInGoogleMaps}
                        title="Open in Google Maps"
                      >
                        <i className="bi bi-geo-alt"></i> View in Google Maps
                      </button>
                    </div>
                    <p>
                      Lat: {activeRequest.lat.toFixed(6)}, Long: {activeRequest.lng.toFixed(6)}
                    </p>
                  </div>
                  
                  {mapError ? (
                    <div className="alert alert-danger mb-3">{mapError}</div>
                  ) : (
                    <div 
                      ref={mapContainerRef}
                      style={{ height: "300px", borderRadius: "8px", marginBottom: "16px" }}
                    ></div>
                  )}
                  
                  <div className="d-grid gap-2">
                    {activeRequest.status === 'pending' && (
                      <button 
                        className="btn btn-success" 
                        onClick={() => handleAcceptRequest(activeRequest._id)}
                      >
                        Accept This Request
                      </button>
                    )}
                    
                    {(activeRequest.status === 'accepted' || activeRequest.status === 'in-transit') && (
                      <div className="btn-group w-100">
                        {activeRequest.status === 'accepted' && (
                          <button 
                            className="btn btn-primary" 
                            onClick={() => handleUpdateStatus(activeRequest._id, 'in-transit')}
                          >
                            Mark In Transit
                          </button>
                        )}
                        
                        {activeRequest.status === 'in-transit' && (
                          <button 
                            className="btn btn-success" 
                            onClick={() => handleUpdateStatus(activeRequest._id, 'delivered')}
                          >
                            Mark Delivered
                          </button>
                        )}
                        
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleUpdateStatus(activeRequest._id, 'cancelled')}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card-body text-center py-5">
                  <p className="text-muted mb-0">Select a request to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardDelivery;
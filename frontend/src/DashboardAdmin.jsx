import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';

function DashboardAdmin({ user, onLogout }) {
  const [deliveryCosts, setDeliveryCosts] = useState({
    petrol: 50,
    diesel: 50,
    gas: 80,
    battery: 100
  });
  
  const [users, setUsers] = useState([]);
  const [bunks, setBunks] = useState([]);
  const [deliveryUsers, setDeliveryUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editType, setEditType] = useState(''); // 'user', 'bunk', etc.
  const [editItemId, setEditItemId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  
  // Fetch all data on component mount
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      
      // Fetch delivery costs
      const costsResponse = await axios.get('http://localhost:5000/admin/delivery-costs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (costsResponse.data.success) {
        setDeliveryCosts(costsResponse.data.costs);
      }
      
      // Fetch users
      const usersResponse = await axios.get('http://localhost:5000/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (usersResponse.data.success) {
        setUsers(usersResponse.data.users);
      }
      
      // Fetch delivery personnel
      const deliveryResponse = await axios.get('http://localhost:5000/admin/delivery-personnel', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (deliveryResponse.data.success) {
        setDeliveryUsers(deliveryResponse.data.deliveryPersonnel);
      }
      
      // Fetch bunks
      const bunksResponse = await axios.get('http://localhost:5000/admin/bunks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (bunksResponse.data.success) {
        setBunks(bunksResponse.data.bunks);
      }
      
      // Fetch all requests
      const requestsResponse = await axios.get('http://localhost:5000/admin/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (requestsResponse.data.success) {
        setRequests(requestsResponse.data.requests);
      }
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
      alert('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      
      // Fetch all requests
      const requestsResponse = await axios.get('http://localhost:5000/admin/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (requestsResponse.data.success) {
        setRequests(requestsResponse.data.requests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('Failed to load request data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateDeliveryCost = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.post('http://localhost:5000/admin/update-delivery-costs', 
        { costs: deliveryCosts },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert('Delivery costs updated successfully!');
      }
    } catch (error) {
      console.error('Error updating delivery costs:', error);
      alert('Failed to update delivery costs');
    }
  };
  
  // Handle opening edit modal
  const handleOpenEditModal = (type, item) => {
    setEditType(type);
    setEditItemId(item._id);
    
    if (type === 'user') {
      setEditFormData({
        username: item.username,
        userType: item.userType,
        email: item.email || '',
        phone: item.phone || '',
      });
    } else if (type === 'bunk') {
      setEditFormData({
        bunkName: item.bunkName || item.name,
        location: item.location || '',
        availableFuels: item.availableFuels || ['petrol', 'diesel', 'gas'],
        lat: item.lat || 0,
        lng: item.lng || 0
      });
    }
    
    setShowEditModal(true);
  };
  
  // Handle closing edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditType('');
    setEditItemId(null);
    setEditFormData({});
  };
  
  // Handle edit form change
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      // For checkboxes (like availableFuels)
      const updatedValue = [...(editFormData[name] || [])];
      if (checked) {
        if (!updatedValue.includes(value)) {
          updatedValue.push(value);
        }
      } else {
        const index = updatedValue.indexOf(value);
        if (index !== -1) {
          updatedValue.splice(index, 1);
        }
      }
      setEditFormData({
        ...editFormData,
        [name]: updatedValue
      });
    } else {
      // For other form fields
      setEditFormData({
        ...editFormData,
        [name]: value
      });
    }
  };
  
  // Handle edit form submit
  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    
    try {
      const token = localStorage.getItem('userToken');
      let endpoint;
      
      if (editType === 'user') {
        endpoint = `/admin/users/${editItemId}`;
      } else if (editType === 'bunk') {
        endpoint = `/admin/bunks/${editItemId}`;
      }
      
      const response = await axios.put(
        `http://localhost:5000${endpoint}`,
        editFormData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert(`${editType.charAt(0).toUpperCase() + editType.slice(1)} updated successfully!`);
        fetchData(); // Refresh data
        handleCloseEditModal();
      }
    } catch (error) {
      console.error(`Error updating ${editType}:`, error);
      alert(`Failed to update ${editType}: ${error.response?.data?.message || 'Unknown error'}`);
    } finally {
      setEditLoading(false);
    }
  };
  
  // Handle delete
  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('userToken');
      let endpoint;
      
      if (type === 'user') {
        endpoint = `/admin/users/${id}`;
      } else if (type === 'bunk') {
        endpoint = `/admin/bunks/${id}`;
      }
      
      const response = await axios.delete(
        `http://localhost:5000${endpoint}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}: ${error.response?.data?.message || 'Unknown error'}`);
    }
  };
  
  const handleApproveRequest = async (requestId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      
      const response = await axios.put(
        `http://localhost:5000/admin/approve-request/${requestId}`, 
        {}, 
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        alert('Request approved successfully!');
        fetchRequests(); // Refresh the requests list
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert(`Failed to approve request: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Edit Modal Component
  const EditModal = () => (
    <div className={`modal ${showEditModal ? 'd-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Edit {editType.charAt(0).toUpperCase() + editType.slice(1)}
            </h5>
            <button type="button" className="btn-close" onClick={handleCloseEditModal} disabled={editLoading}></button>
          </div>
          <div className="modal-body">
            {editType === 'user' && (
              <form onSubmit={handleEditFormSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="username" 
                    name="username"
                    value={editFormData.username || ''}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    id="email" 
                    name="email"
                    value={editFormData.email || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="phone" className="form-label">Phone</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="phone" 
                    name="phone"
                    value={editFormData.phone || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="userType" className="form-label">User Type</label>
                  <select 
                    className="form-select" 
                    id="userType" 
                    name="userType"
                    value={editFormData.userType || 'user'}
                    onChange={handleEditFormChange}
                    required
                  >
                    <option value="user">Customer</option>
                    <option value="delivery">Delivery</option>
                    <option value="bunk">Bunk</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </form>
            )}
            
            {editType === 'bunk' && (
              <form onSubmit={handleEditFormSubmit}>
                <div className="mb-3">
                  <label htmlFor="bunkName" className="form-label">Bunk Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="bunkName" 
                    name="bunkName"
                    value={editFormData.bunkName || ''}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="location" className="form-label">Location</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="location" 
                    name="location"
                    value={editFormData.location || ''}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Coordinates</label>
                  <div className="row">
                    <div className="col">
                      <input 
                        type="number" 
                        step="any"
                        className="form-control" 
                        placeholder="Latitude"
                        name="lat"
                        value={editFormData.lat || 0}
                        onChange={handleEditFormChange}
                        required
                      />
                    </div>
                    <div className="col">
                      <input 
                        type="number" 
                        step="any"
                        className="form-control" 
                        placeholder="Longitude"
                        name="lng"
                        value={editFormData.lng || 0}
                        onChange={handleEditFormChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Available Fuels</label>
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="petrol" 
                      name="availableFuels"
                      value="petrol"
                      checked={(editFormData.availableFuels || []).includes('petrol')}
                      onChange={handleEditFormChange}
                    />
                    <label className="form-check-label" htmlFor="petrol">
                      Petrol
                    </label>
                  </div>
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="diesel" 
                      name="availableFuels"
                      value="diesel"
                      checked={(editFormData.availableFuels || []).includes('diesel')}
                      onChange={handleEditFormChange}
                    />
                    <label className="form-check-label" htmlFor="diesel">
                      Diesel
                    </label>
                  </div>
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="gas" 
                      name="availableFuels"
                      value="gas"
                      checked={(editFormData.availableFuels || []).includes('gas')}
                      onChange={handleEditFormChange}
                    />
                    <label className="form-check-label" htmlFor="gas">
                      Gas
                    </label>
                  </div>
                </div>
              </form>
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleCloseEditModal}
              disabled={editLoading}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleEditFormSubmit}
              disabled={editLoading}
            >
              {editLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Tab content components
  const DashboardTab = () => (
    <div className="row g-4">
      <div className="col-md-3">
        <div className="card text-white bg-primary">
          <div className="card-body">
            <h5 className="card-title">Users</h5>
            <p className="card-text display-4">{users.length}</p>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card text-white bg-success">
          <div className="card-body">
            <h5 className="card-title">Delivery Personnel</h5>
            <p className="card-text display-4">{deliveryUsers.length}</p>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card text-white bg-info">
          <div className="card-body">
            <h5 className="card-title">Bunks</h5>
            <p className="card-text display-4">{bunks.length}</p>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card text-white bg-warning">
          <div className="card-body">
            <h5 className="card-title">Total Requests</h5>
            <p className="card-text display-4">{requests.length}</p>
          </div>
        </div>
      </div>
      
      {/* Delivery Cost Settings */}
      <div className="col-12 mt-4">
        <div className="card">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0">Delivery Cost Settings</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleUpdateDeliveryCost}>
              <div className="row g-3">
                <div className="col-md-6 col-lg-3">
                  <label className="form-label">Petrol Delivery Cost (₹)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={deliveryCosts.petrol}
                    onChange={(e) => setDeliveryCosts({...deliveryCosts, petrol: Number(e.target.value)})}
                    min="0"
                  />
                </div>
                <div className="col-md-6 col-lg-3">
                  <label className="form-label">Diesel Delivery Cost (₹)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={deliveryCosts.diesel}
                    onChange={(e) => setDeliveryCosts({...deliveryCosts, diesel: Number(e.target.value)})}
                    min="0"
                  />
                </div>
                <div className="col-md-6 col-lg-3">
                  <label className="form-label">Gas Delivery Cost (₹)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={deliveryCosts.gas}
                    onChange={(e) => setDeliveryCosts({...deliveryCosts, gas: Number(e.target.value)})}
                    min="0"
                  />
                </div>
                <div className="col-md-6 col-lg-3">
                  <label className="form-label">Battery Delivery Cost (₹)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={deliveryCosts.battery}
                    onChange={(e) => setDeliveryCosts({...deliveryCosts, battery: Number(e.target.value)})}
                    min="0"
                  />
                </div>
                <div className="col-12 mt-3">
                  <button type="submit" className="btn btn-primary">
                    Update Delivery Costs
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
  
  const UsersTab = () => (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">Manage Users</h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Username</th>
                <th>User Type</th>
                <th>Registered On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">No users found</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>{user.userType}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => handleOpenEditModal('user', user)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete('user', user._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  
  const BunksTab = () => (
    <div className="card">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">Manage Bunks</h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Bunk Name</th>
                <th>Location</th>
                <th>Available Fuels</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bunks.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">No bunks found</td>
                </tr>
              ) : (
                bunks.map(bunk => (
                  <tr key={bunk._id}>
                    <td>{bunk.bunkName || bunk.name}</td>
                    <td>{bunk.location}</td>
                    <td>{(bunk.availableFuels || []).join(', ')}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => handleOpenEditModal('bunk', bunk)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete('bunk', bunk._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
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
                  <th>Status</th>
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
                      <span className={`badge bg-${
                        request.status === 'pending' ? 'warning' :
                        request.status === 'approved' ? 'info' :
                        request.status === 'in-transit' ? 'primary' :
                        request.status === 'delivered' ? 'success' :
                        'danger'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      {request.status === 'pending' ? (
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleApproveRequest(request._id)}
                          disabled={loading}
                        >
                          {loading ? 'Processing...' : 'Approve'}
                        </button>
                      ) : (
                        <span className="text-muted">Processed</span>
                      )}
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
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Refreshing...
              </>
            ) : 'Refresh Requests'}
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="dashboard-container">
      <Navbar userType="admin" onLogout={onLogout} />
      
      <div className="container py-4">
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="mb-3">Admin Dashboard</h2>
            <p className="text-muted">Manage all aspects of your refueling application</p>
            
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('dashboard')}
                >
                  Dashboard
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('users')}
                >
                  Users
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'bunks' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('bunks')}
                >
                  Bunks
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('requests')}
                >
                  Requests
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading dashboard data...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'bunks' && <BunksTab />}
            {activeTab === 'requests' && renderRequests()}
          </div>
        )}
      </div>
      
      {/* Edit Modal */}
      <EditModal />
    </div>
  );
}

export default DashboardAdmin;
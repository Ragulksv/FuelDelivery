import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function DashboardUser({ user, onLogout }) {
  const [fuelType, setFuelType] = useState('petrol');
  const [quantity, setQuantity] = useState(5);
  const [fuelBrand, setFuelBrand] = useState('');
  const [batteryType, setBatteryType] = useState('lithium-ion');
  const [batteryCapacity, setBatteryCapacity] = useState('12V');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [mapError, setMapError] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  // Bill summary state
  const [showBillSummary, setShowBillSummary] = useState(false);
  const [billDetails, setBillDetails] = useState({
    basePrice: 0,
    gst: 0,
    deliveryCharge: 0,
    discount: 0,
    total: 0
  });
  
  // Add these new state variables for tracking updated coordinates
  const [updatedLat, setUpdatedLat] = useState(user?.lat);
  const [updatedLng, setUpdatedLng] = useState(user?.lng);
  
  // Define available brands for each fuel type
  const fuelBrands = {
    petrol: ['Indian Oil', 'Bharat Petroleum', 'HP Petrol', 'Shell', 'Reliance', 'Essar','Nearby Station'],
    diesel: ['Indian Oil', 'Bharat Petroleum', 'HP Diesel', 'Shell V-Power', 'Essar', 'Reliance Diesel'],
    gas: ['Indane', 'HP Gas', 'Bharat Gas', 'Reliance Gas', 'GoGas', 'Supergas']
  };
  
  // Set default brand when fuel type changes
  useEffect(() => {
    if (fuelType === 'petrol' || fuelType === 'diesel' || fuelType === 'gas') {
      setFuelBrand(fuelBrands[fuelType][0]);
    }
  }, [fuelType]);
  
  // Load user's fuel requests
  useEffect(() => {
    fetchRequests();
  }, []);
  
  useEffect(() => {
    if (!user || !user.lat || !user.lng) {
      return;
    }
    
    // Set initial values when user data loads
    setUpdatedLat(user.lat);
    setUpdatedLng(user.lng);
    
    const initializeMap = () => {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      
      try {
        const map = L.map(mapContainerRef.current).setView([user.lat, user.lng], 15);
        mapInstanceRef.current = map;
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Create a draggable marker
        const marker = L.marker([user.lat, user.lng], {
          draggable: true,
          autoPan: true
        }).addTo(map);
        
        // Add popup to the marker
        marker.bindPopup('Drag to adjust your location').openPopup();
        
        // Handle marker drag events
        marker.on('dragend', function() {
          const position = marker.getLatLng();
          
          // Close existing popup and bind a new one
          marker.closePopup();
          marker.unbindPopup();
          marker.bindPopup(
            `New Location:<br>Lat: ${position.lat.toFixed(6)}<br>Lng: ${position.lng.toFixed(6)}`
          ).openPopup();
          
          // Update the state with new coordinates
          setUpdatedLat(position.lat);
          setUpdatedLng(position.lng);
          
          console.log("Location updated:", position);
        });
        
        setTimeout(() => {
          if (map && mapContainerRef.current) {
            map.invalidateSize();
          }
        }, 300);
        
        // Clear any previous errors
        setMapError(null);
      } catch (error) {
        console.error("Error initializing map:", error);
        setMapError("Failed to load map. Please refresh the page.");
      }
    };
    
    const timer = setTimeout(initializeMap, 500);
    
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
  }, [user]);

  // Fetch user's fuel requests
  const fetchRequests = async () => {
    if (!localStorage.getItem('userToken')) {
      return; 
    }
    
    setLoadingRequests(true);
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get('http://localhost:5000/my-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setRequests(response.data?.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('Failed to load your fuel requests');
    } finally {
      setLoadingRequests(false);
    }
  };
  
  // Calculate bill details based on selected options
  const calculateBillDetails = () => {
    let basePrice = 0;
    let gst = 0;
    let deliveryCharge = 50; // Base delivery charge
    let discount = 0;
    
    if (fuelType === 'battery') {
      // Base prices for different battery types
      switch (batteryCapacity) {
        case '12V':
          basePrice = 1200;
          break;
        case '24V':
          basePrice = 2400;
          break;
        case '48V':
          basePrice = 4800;
          break;
        case 'AA':
          basePrice = 120;
          break;
        case 'AAA':
          basePrice = 100;
          break;
        case '9V':
          basePrice = 300;
          break;
        default:
          basePrice = 1000;
      }
      
      // Premium for lithium-ion batteries
      if (batteryType === 'lithium-ion') {
        basePrice *= 1.5; // 50% premium
      }
      
      // Adjusted delivery charge for batteries
      deliveryCharge = 100; // Higher for batteries
    } else if (fuelType === 'gas') {
      // Gas prices based on quantity (in kg)
      const pricePerKg = 85.50;
      basePrice = pricePerKg * quantity;
      
      // Premium for branded gas
      if (fuelBrand && (fuelBrand.includes('HP') || fuelBrand.includes('Indane'))) {
        basePrice *= 1.05; // 5% premium
      }
      
      // Discount for larger quantities
      if (quantity >= 10) {
        discount = basePrice * 0.03; // 3% discount for 10+ kg
      }
      
      // Higher delivery charge for gas
      deliveryCharge = 80;
    } else {
      // Fuel prices
      const pricePerLiter = fuelType === 'petrol' ? 100.50 : 90.20;
      basePrice = pricePerLiter * quantity;
      
      // Premium for branded fuel
      if (fuelBrand && (fuelBrand.includes('Shell') || fuelBrand.includes('V-Power'))) {
        basePrice *= 1.1; // 10% premium
      }
      
      // Discount for larger quantities
      if (quantity >= 20) {
        discount = basePrice * 0.05; // 5% discount for 20+ liters
      }
    }
    
    // GST calculation (18% for example)
    gst = basePrice * 0.18;
    
    // Total calculation
    const total = basePrice + gst + deliveryCharge - discount;
    
    return {
      basePrice: parseFloat(basePrice.toFixed(2)),
      gst: parseFloat(gst.toFixed(2)),
      deliveryCharge,
      discount: parseFloat(discount.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  };
  
  // Handle form submission
  const handleRequestFuel = async (e) => {
    e.preventDefault();
    
    // Calculate bill details
    const billDetails = calculateBillDetails();
    setBillDetails(billDetails);
    setShowBillSummary(true);
  };
  
  // Handle payment confirmation
  const handlePaymentConfirmation = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('userToken');
  
      // Step 1: Create order on your backend first
      const orderResponse = await axios.post('http://localhost:5000/create-order', {
        amount: billDetails.total,
        currency: 'INR',
        fuelType,
        quantity: fuelType === 'battery' ? null : Number(quantity),
        batteryType: fuelType === 'battery' ? batteryType : null,
        batteryCapacity: fuelType === 'battery' ? batteryCapacity : null,
        fuelBrand: fuelType !== 'battery' ? fuelBrand : null
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Step 2: Get order ID from backend to ensure amount consistency
      const { orderId, amount } = orderResponse.data;
      
      // Step 3: Initialize Razorpay with the order ID from backend
      const options = {
        key: 'rzp_test_in9Fbr3JPonj4O', // Your Razorpay key
        amount: amount, // Use amount from server (in paise)
        currency: 'INR',
        name: 'Fuel Delivery System',
        description: `Payment for ${fuelType} delivery`,
        order_id: orderId, // This is important - use order ID from backend
        image: 'https://example.com/logo.png', // Use a valid image URL
        handler: async function (response) {
          try {
            // Step 4: Verify payment with your backend
            await axios.post('http://localhost:5000/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Step 5: Create the fuel request after payment verification
            let payload;
            if (fuelType === 'battery') {
              payload = {
                fuelType,
                batteryType,
                batteryCapacity,
                lat: updatedLat,
                lng: updatedLng,
                price: billDetails.total,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id
              };
            } else {
              payload = {
                fuelType,
                fuelBrand,
                quantity: Number(quantity),
                lat: updatedLat,
                lng: updatedLng,
                price: billDetails.total,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id
              };  
            }
            
            await axios.post('http://localhost:5000/fuel-request', payload, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Close bill summary, refresh requests
            setShowBillSummary(false);
            fetchRequests();
            
            // Reset form
            setFuelType('petrol');
            setQuantity(5);
            setFuelBrand(fuelBrands.petrol[0]);
            setBatteryType('lithium-ion');
            setBatteryCapacity('12V');
            
            // Show success message
            alert('Payment successful! Your request has been created.');
          } catch (error) {
            console.error('Error processing payment:', error);
            alert('Payment was successful, but request creation failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.username || '',
          contact: user?.phone || '',
          email: user?.email || ''
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };
      
      // Load Razorpay script dynamically if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          const razorpayInstance = new window.Razorpay(options);
          razorpayInstance.open();
        };
        document.body.appendChild(script);
      } else {
        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();
      }
      
    } catch (error) {
      console.error('Error initializing payment:', error);
      alert('Failed to initialize payment. Please try again.');
      setLoading(false);
    }
  };
  
  // Close bill summary
  const handleCloseBillSummary = () => {
    setShowBillSummary(false);
    setLoading(false);
  };
  
  // Handle fuel type change
  const handleFuelTypeChange = (e) => {
    setFuelType(e.target.value);
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
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="dashboard-container">
      <Navbar userType="user" onLogout={onLogout} />
      
      <div className="container py-4">
        <div className="row">
          {/* Left column - User Info and Map */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title">Welcome, {user?.username || 'User'}!</h5>
                <p className="card-text text-muted">Your location is set to:</p>
                <p>
                  <strong>Latitude:</strong> {updatedLat?.toFixed(6) || 'N/A'}° <br />
                  <strong>Longitude:</strong> {updatedLng?.toFixed(6) || 'N/A'}°
                </p>
              </div>
            </div>
            
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3">Your Location</h5>
                {mapError ? (
                  <div className="alert alert-danger">{mapError}</div>
                ) : (
                  <div 
                    ref={mapContainerRef} 
                    style={{ height: "300px", borderRadius: "8px" }}
                  ></div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right column - Request Form and History */}
          <div className="col-md-6">
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title">Request Delivery</h5>
                <form onSubmit={handleRequestFuel}>
                  <div className="mb-3">
                    <label className="form-label">Product Type</label>
                    <select 
                      className="form-select" 
                      value={fuelType} 
                      onChange={handleFuelTypeChange}
                      required
                    >
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="gas">Gas</option>
                      <option value="battery">Battery</option>
                    </select>
                  </div>
                  
                  {fuelType === 'battery' ? (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Battery Type</label>
                        <select 
                          className="form-select" 
                          value={batteryType} 
                          onChange={(e) => setBatteryType(e.target.value)}
                          required
                        >
                          <option value="lithium-ion">Lithium Ion</option>
                          <option value="lead-acid">Lead Acid</option>
                          <option value="nickel-cadmium">Nickel Cadmium</option>
                          <option value="alkaline">Alkaline</option>
                        </select>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">Battery Capacity</label>
                        <select 
                          className="form-select" 
                          value={batteryCapacity} 
                          onChange={(e) => setBatteryCapacity(e.target.value)}
                          required
                        >
                          <option value="12V">12V</option>
                          <option value="24V">24V</option>
                          <option value="48V">48V</option>
                          <option value="AA">AA Size</option>
                          <option value="AAA">AAA Size</option>
                          <option value="9V">9V</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Fuel brand selection for petrol or diesel */}
                      <div className="mb-3">
                        <label className="form-label">Brand</label>
                        <select 
                          className="form-select" 
                          value={fuelBrand} 
                          onChange={(e) => setFuelBrand(e.target.value)}
                          required
                        >
                          {fuelBrands[fuelType]?.map((brand) => (
                            <option key={brand} value={brand}>{brand}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">Quantity (Liters)</label>
                        <div className="input-group">
                          <input 
                            type="number" 
                            className="form-control"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="1"
                            max="100"
                            required
                          />
                          <span className="input-group-text">Liters</span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="d-grid">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : fuelType === 'battery' ? 'Request Battery Now' : 'Request Fuel Now'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Your Request History</h5>
                
                {loadingRequests ? (
                  <p className="text-center my-4">Loading your requests...</p>
                ) : !requests || requests.length === 0 ? (
                  <p className="text-center my-4">You haven't made any requests yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Details</th>
                          <th>Price</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map(request => (
                          <tr key={request._id}>
                            <td>{formatDate(request.createdAt)}</td>
                            <td className="text-capitalize">{request.fuelType}</td>
                            <td>
                              {request.fuelType === 'battery' 
                                ? `${request.batteryType || 'Standard'} (${request.batteryCapacity || '-'})` 
                                : `${request.fuelBrand || ''} ${request.quantity} L`}
                            </td>
                            <td>₹{request.price?.toFixed(2) || '0.00'}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                                {request.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="d-flex justify-content-center mt-3">
                  <button 
                    className="btn btn-sm btn-outline-secondary" 
                    onClick={fetchRequests}
                    disabled={loadingRequests}
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bill Summary Modal */}
      {showBillSummary && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1060, margin: 0, position: 'relative' }}>
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Bill Summary for {user?.username || 'Customer'}</h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={handleCloseBillSummary}
                  disabled={loading}
                ></button>
              </div>
              <div className="modal-body">
                <div className="card mb-3">
                  <div className="card-body">
                    <h6 className="card-subtitle mb-3 text-muted">Order Details</h6>
                    <p><strong>Product:</strong> <span className="text-capitalize">{fuelType}</span></p>
                    {fuelType === 'battery' ? (
                      <>
                        <p><strong>Type:</strong> {batteryType}</p>
                        <p><strong>Capacity:</strong> {batteryCapacity}</p>
                      </>
                    ) : (
                      <>
                        <p><strong>Brand:</strong> {fuelBrand}</p>
                        <p><strong>Quantity:</strong> {quantity} Liters</p>
                      </>
                    )}
                  </div>
                </div>
                
                <table className="table">
                  <tbody>
                    <tr>
                      <td>Base Price</td>
                      <td className="text-end">{formatCurrency(billDetails.basePrice)}</td>
                    </tr>
                    <tr>
                      <td>GST (18%)</td>
                      <td className="text-end">{formatCurrency(billDetails.gst)}</td>
                    </tr>
                    <tr>
                      <td>Delivery Charge</td>
                      <td className="text-end">{formatCurrency(billDetails.deliveryCharge)}</td>
                    </tr>
                    {billDetails.discount > 0 && (
                      <tr className="text-success">
                        <td>Discount</td>
                        <td className="text-end">- {formatCurrency(billDetails.discount)}</td>
                      </tr>
                    )}
                    <tr className="fw-bold">
                      <td>Total Amount</td>
                      <td className="text-end">{formatCurrency(billDetails.total)}</td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="alert alert-info d-flex align-items-center small">
                  <i className="bi bi-info-circle me-2"></i>
                  <div>Payments are secured by Razorpay. Click "Pay Now" to complete your order.</div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseBillSummary}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={handlePaymentConfirmation}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>Pay Now {formatCurrency(billDetails.total)}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardUser;
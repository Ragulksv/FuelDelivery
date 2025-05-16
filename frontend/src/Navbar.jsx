import React from 'react';

function Navbar({ userType, onLogout }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div className="container-fluid">
        <div className="navbar-brand fw-bold d-flex align-items-center">
          <div className="me-2">
            <img 
              src="/refuelx-logo.png" 
              alt="RefuelX" 
              width="36" 
              height="36" 
              className="d-inline-block align-top"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4IiBmaWxsPSJub25lIj48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyNCIgZmlsbD0iIzAwNmJmZiIvPjx0ZXh0IHg9IjI0IiB5PSIyOCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC13ZWlnaHQ9ImJvbGQiPlJYPC90ZXh0Pjwvc3ZnPg==";
              }}
            />
          </div>
          <span>RefuelX</span>
        </div>
        
        <div className="d-flex align-items-center">
          <span className="badge bg-light text-dark me-3 px-3 py-2">
            {userType === 'user' && 'Customer Dashboard'}
            {userType === 'delivery' && 'Delivery Dashboard'}
            {userType === 'bunk' && 'Bunk Dashboard'}
            {userType === 'admin' && 'Admin Dashboard'}
          </span>
          <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
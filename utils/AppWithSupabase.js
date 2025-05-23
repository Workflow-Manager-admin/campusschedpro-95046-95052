import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import CourseScheduling from './components/CourseScheduling';
import { FacultyManagement } from './components/faculty';
import { RoomManagement, RoomAllocation } from './components/rooms';
import { ConflictResolution } from './components/conflicts';
import { SupabaseScheduleProvider } from './utils/SupabaseScheduleContext';
import './App.css';
import './styles/CourseScheduling.css';
import './styles/FacultyManagement.css';
import './styles/RoomStyles.css';
import './styles/ConflictResolution.css';
import { CircularProgress } from '@mui/material';

// Loading indicator component
const LoadingIndicator = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100vh',
    backgroundColor: 'var(--kavia-dark)',
    color: 'white'
  }}>
    <div style={{ textAlign: 'center' }}>
      <CircularProgress color="inherit" size={60} />
      <h2 style={{ marginTop: 20 }}>Loading CampusSchedPro...</h2>
    </div>
  </div>
);

// App wrapper with loading state
const AppContent = ({ children, isLoading }) => {
  if (isLoading) {
    return <LoadingIndicator />;
  }
  
  return children;
};

function App() {
  return (
    <SupabaseScheduleProvider>
      {({ isLoading }) => (
        <Router>
          <AppContent isLoading={isLoading}>
            <div className="app">
              <nav className="sidebar">
                <div className="logo-container">
                  <span className="nav-icon">🎓</span>
                  <span className="logo logo-text">CampusSchedPro</span>
                </div>
                
                <NavLink 
                  to="/" 
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  end
                >
                  <span className="nav-icon">📅</span>
                  <span className="nav-text">Course Scheduling</span>
                </NavLink>
                
                <NavLink 
                  to="/faculty" 
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="nav-icon">👥</span>
                  <span className="nav-text">Faculty Management</span>
                </NavLink>
                
                <NavLink 
                  to="/rooms" 
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="nav-icon">🏢</span>
                  <span className="nav-text">Room Management</span>
                </NavLink>
                
                <NavLink 
                  to="/room-allocation" 
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="nav-icon">📍</span>
                  <span className="nav-text">Room Allocation</span>
                </NavLink>
                
                <NavLink 
                  to="/conflicts" 
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="nav-icon">⚠️</span>
                  <span className="nav-text">Conflict Resolution</span>
                </NavLink>
                
                <div className="database-status">
                  <span className="status-indicator connected"></span>
                  <span className="status-text">Connected to Supabase</span>
                </div>
              </nav>

              <main className="main-content">
                <Routes>
                  <Route path="/" element={<CourseScheduling />} />
                  <Route path="/faculty" element={<FacultyManagement />} />
                  <Route path="/rooms" element={<RoomManagement />} />
                  <Route path="/room-allocation" element={<RoomAllocation />} />
                  <Route path="/conflicts" element={<ConflictResolution />} />
                </Routes>
              </main>
            </div>
          </AppContent>
        </Router>
      )}
    </SupabaseScheduleProvider>
  );
}

export default App;

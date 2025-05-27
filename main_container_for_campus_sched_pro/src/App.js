import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import CourseScheduling from './components/CourseScheduling';
import { FacultyManagement } from './components/faculty';
import { RoomManagement, RoomAllocation } from './components/rooms';
import { ConflictResolution } from './components/conflicts';
import { EnhancedScheduleProvider } from './context/EnhancedScheduleProvider';
import { useSchedule } from './context/ScheduleContext';
import { CircularProgress, Alert, Snackbar } from '@mui/material';
import './App.css';
import './styles/CourseScheduling.css';
import './styles/FacultyManagement.css';
import './styles/RoomStyles.css';
import './styles/ConflictResolution.css';
import './styles/BulkImport.css';

/**
 * AppContent now delegates all loading indicators to local components.
 * No global or full-page loading overlays are shown here.
 * Components must handle their own loading UI individually for granular feedback.
 */
const AppContent = () => {
  const { errors, notification, handleCloseNotification, refreshData } = useSchedule();

  if (errors?.general) {
    return (
      <div className="error-container">
        <Alert 
          severity="error" 
          action={
            <button className="btn btn-accent" onClick={refreshData}>
              Retry
            </button>
          }
        >
          {errors.general}
        </Alert>
      </div>
    );
  }

  return (
    <Router>
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
        </nav>

        <main className="main-content">
          <Routes>
            {/* Main content is responsible for granular loading indicators; 
                the below components will receive loading UI improvements */}
            <Route path="/" element={<CourseScheduling />} />
            <Route path="/faculty" element={<FacultyManagement />} />
            <Route path="/rooms" element={<RoomManagement />} />
            <Route path="/room-allocation" element={<RoomAllocation />} />
            <Route path="/conflicts" element={<ConflictResolution />} />
          </Routes>
        </main>

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </div>
    </Router>
  );
};

function App() {
  return (
    <EnhancedScheduleProvider>
      <AppContent />
    </EnhancedScheduleProvider>
  );
}

export default App;

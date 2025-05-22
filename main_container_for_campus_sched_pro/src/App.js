import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import WarningIcon from '@mui/icons-material/Warning';
import SchoolIcon from '@mui/icons-material/School';
import './App.css';

// Placeholder components for each section
const CourseScheduling = () => (
  <div className="dashboard-grid">
    <div className="dashboard-card">
      <div className="card-header">
        <h2 className="card-title">Course Schedule</h2>
        <button className="btn">Add Course</button>
      </div>
      <p>Drag and drop interface for course scheduling will be implemented here</p>
    </div>
  </div>
);

const FacultyManagement = () => (
  <div className="dashboard-grid">
    <div className="dashboard-card">
      <div className="card-header">
        <h2 className="card-title">Faculty Directory</h2>
        <button className="btn">Add Faculty</button>
      </div>
      <p>Faculty management interface will be implemented here</p>
    </div>
  </div>
);

const RoomAllocation = () => (
  <div className="dashboard-grid">
    <div className="dashboard-card">
      <div className="card-header">
        <h2 className="card-title">Room Allocation</h2>
        <button className="btn">Assign Room</button>
      </div>
      <p>Room allocation interface will be implemented here</p>
    </div>
  </div>
);

const ConflictResolution = () => (
  <div className="dashboard-grid">
    <div className="dashboard-card">
      <div className="card-header">
        <h2 className="card-title">Schedule Conflicts</h2>
        <button className="btn btn-accent">Resolve All</button>
      </div>
      <p>Conflict resolution interface will be implemented here</p>
    </div>
  </div>
);

const StudentView = () => (
  <div className="dashboard-grid">
    <div className="dashboard-card">
      <div className="card-header">
        <h2 className="card-title">Student Schedule View</h2>
        <button className="btn">Print Schedule</button>
      </div>
      <p>Student view interface will be implemented here</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="sidebar">
          <div className="logo-container">
            <SchoolIcon />
            <span className="logo logo-text">CampusSchedPro</span>
          </div>
          
          <NavLink to="/" className="nav-item" end>
            <CalendarMonthIcon />
            <span className="nav-text">Course Scheduling</span>
          </NavLink>
          
          <NavLink to="/faculty" className="nav-item">
            <PeopleIcon />
            <span className="nav-text">Faculty Management</span>
          </NavLink>
          
          <NavLink to="/rooms" className="nav-item">
            <MeetingRoomIcon />
            <span className="nav-text">Room Allocation</span>
          </NavLink>
          
          <NavLink to="/conflicts" className="nav-item">
            <WarningIcon />
            <span className="nav-text">Conflict Resolution</span>
          </NavLink>
          
          <NavLink to="/student-view" className="nav-item">
            <SchoolIcon />
            <span className="nav-text">Student View</span>
          </NavLink>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<CourseScheduling />} />
            <Route path="/faculty" element={<FacultyManagement />} />
            <Route path="/rooms" element={<RoomAllocation />} />
            <Route path="/conflicts" element={<ConflictResolution />} />
            <Route path="/student-view" element={<StudentView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import CourseScheduling from './components/CourseScheduling';
import { FacultyManagement } from './components/faculty';
import './App.css';
import './styles/CourseScheduling.css';
import './styles/FacultyManagement.css';
import './styles/RoomStyles.css';
import { RoomAllocation, RoomManagement } from './components/rooms';

const ConflictResolution = () => (
  <div className="dashboard-card">
    <div className="card-header">
      <h2 className="card-title">Schedule Conflicts</h2>
      <button className="btn btn-accent">Resolve All</button>
    </div>
    <p>Conflict resolution interface will be implemented here</p>
  </div>
);

const StudentView = () => (
  <div className="dashboard-card">
    <div className="card-header">
      <h2 className="card-title">Student Schedule View</h2>
      <button className="btn">Print Schedule</button>
    </div>
    <p>Student view interface will be implemented here</p>
  </div>
);

function App() {
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
          
          <NavLink 
            to="/student-view" 
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">👨‍🎓</span>
            <span className="nav-text">Student View</span>
          </NavLink>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<CourseScheduling />} />
            <Route path="/faculty" element={<FacultyManagement />} />
            <Route path="/rooms" element={<RoomManagement />} />
            <Route path="/room-allocation" element={<RoomAllocation />} />
            <Route path="/conflicts" element={<ConflictResolution />} />
            <Route path="/student-view" element={<StudentView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

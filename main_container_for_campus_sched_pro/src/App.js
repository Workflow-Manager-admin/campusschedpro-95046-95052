import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import CourseScheduling from './components/CourseScheduling';
import { FacultyManagement } from './components/faculty';
import { RoomManagement, RoomAllocation } from './components/rooms';
import { ConflictResolution } from './components/conflicts';
import { ScheduleProvider } from './context/ScheduleContext';
import './App.css';
import './styles/CourseScheduling.css';
import './styles/FacultyManagement.css';
import './styles/RoomStyles.css';
import './styles/ConflictResolution.css';

function App() {
  return (
    <ScheduleProvider>
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
              <Route path="/" element={<CourseScheduling />} />
              <Route path="/faculty" element={<FacultyManagement />} />
              <Route path="/rooms" element={<RoomManagement />} />
              <Route path="/room-allocation" element={<RoomAllocation />} />
              <Route path="/conflicts" element={<ConflictResolution />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ScheduleProvider>
  );
}

export default App;

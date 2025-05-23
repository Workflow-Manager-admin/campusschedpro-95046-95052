import React, { useState, useEffect, useCallback } from 'react';
import { CircularProgress } from '@mui/material';

import { 
  getFacultyStatus 
} from '../../utils/facultyUtils';
import { useSchedule } from '../../context/ScheduleContext';
import { getAllFaculty, getFacultyAssignments, saveFaculty, deleteFaculty } from '../../utils/supabaseClient';
import FacultyCard from './FacultyCard';
import FacultyDetails from './FacultyDetails';

const FacultyManagement = () => {
  // Get context functions for notifications
  const { showNotification } = useSchedule();
  
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    department: '',
    email: '',
    expertise: ''
  });

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  const filteredFaculty = faculty.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || f.status.toLowerCase().includes(statusFilter.toLowerCase());
    return matchesSearch && matchesStatus;
  });

  const handleSelectFaculty = (selected) => {
    setSelectedFaculty(selected);
  };

  const handleAddFaculty = () => {
    const newId = `faculty-${faculty.length + 1}`;
    const newFacultyMember = {
      ...newFaculty,
      id: newId,
      assignments: [],
      expertise: newFaculty.expertise.split(',').map(e => e.trim())
    };
    
    const updatedFaculty = getFacultyStatus(newFacultyMember, []);
    setFaculty(prev => [...prev, updatedFaculty]);
    setShowAddDialog(false);
    setNewFaculty({ name: '', department: '', email: '', expertise: '' });
  };

  const handleUpdateFaculty = (updatedFaculty) => {
    setFaculty(prev => prev.map(f => 
      f.id === updatedFaculty.id ? { ...updatedFaculty } : f
    ));
    setSelectedFaculty(updatedFaculty);
  };

  const handleDeleteFaculty = (facultyId) => {
    setFaculty(prev => prev.filter(f => f.id !== facultyId));
    setSelectedFaculty(null);
  };

  return (
    <div className="faculty-management">
      <div className="faculty-header">
        <h2>Faculty Management</h2>
        <button className="btn" onClick={() => setShowAddDialog(true)}>
          + Add Faculty
        </button>
      </div>

      <div className="faculty-container">
        <div className="faculty-list">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search faculty..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          <div className="faculty-filters">
            {['all', 'available', 'partially booked', 'fully booked'].map(status => (
              <div
                key={status}
                className={`filter-chip ${statusFilter === status ? 'active' : ''}`}
                onClick={() => handleStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
            ))}
          </div>

          <div className="faculty-grid">
            {filteredFaculty.map(f => (
              <FacultyCard
                key={f.id}
                faculty={f}
                selected={selectedFaculty?.id === f.id}
                onClick={() => handleSelectFaculty(f)}
              />
            ))}
          </div>
        </div>

        {selectedFaculty && (
          <FacultyDetails
            faculty={selectedFaculty}
            onSave={handleUpdateFaculty}
            onDelete={() => handleDeleteFaculty(selectedFaculty.id)}
            onClose={() => setSelectedFaculty(null)}
          />
        )}
      </div>

      {showAddDialog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="dialog-content" style={{ padding: '24px' }}>
              <h2>Add New Faculty</h2>
              
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newFaculty.name}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={newFaculty.department}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newFaculty.email}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Expertise (comma-separated)</label>
                <input
                  type="text"
                  value={newFaculty.expertise}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, expertise: e.target.value }))}
                />
              </div>
              
              <div className="dialog-actions">
                <button className="btn" onClick={() => setShowAddDialog(false)}>Cancel</button>
                <button 
                  className="btn btn-accent" 
                  onClick={handleAddFaculty}
                  disabled={!newFaculty.name || !newFaculty.department || !newFaculty.email}
                >
                  Add Faculty
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyManagement;

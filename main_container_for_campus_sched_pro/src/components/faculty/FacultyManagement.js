import React, { useState, useCallback } from 'react';
import { Dialog, TextField } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

import { 
  calculateTeachingLoad, 
  getFacultyStatus, 
  validateCourseAssignment 
} from '../../utils/facultyUtils';
import FacultyCard from './FacultyCard';
import FacultyDetails from './FacultyDetails';

// Sample initial data
const INITIAL_FACULTY = [
  {
    id: 'faculty-1',
    name: 'Dr. Sarah Johnson',
    department: 'Computer Science',
    email: 'sarah.johnson@university.edu',
    expertise: ['Algorithms', 'Data Structures', 'Machine Learning'],
    assignments: [
      {
        id: 'course-1',
        code: 'CS101',
        name: 'Introduction to Computer Science',
        schedule: ['Monday-9:00 AM', 'Wednesday-9:00 AM']
      }
    ]
  },
  {
    id: 'faculty-2',
    name: 'Prof. Michael Chen',
    department: 'Computer Science',
    email: 'michael.chen@university.edu',
    expertise: ['Database Systems', 'Web Development'],
    assignments: []
  }
].map(faculty => ({
  ...faculty,
  ...getFacultyStatus(faculty, faculty.assignments)
}));

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState(INITIAL_FACULTY);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    department: '',
    email: '',
    expertise: []
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
    setNewFaculty({ name: '', department: '', email: '', expertise: [] });
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
          <AddIcon /> Add Faculty
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

      <Dialog 
        open={showAddDialog} 
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <div className="dialog-content" style={{ padding: '24px' }}>
          <h2>Add New Faculty</h2>
          <TextField
            fullWidth
            label="Name"
            value={newFaculty.name}
            onChange={(e) => setNewFaculty(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Department"
            value={newFaculty.department}
            onChange={(e) => setNewFaculty(prev => ({ ...prev, department: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={newFaculty.email}
            onChange={(e) => setNewFaculty(prev => ({ ...prev, email: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Expertise (comma-separated)"
            value={newFaculty.expertise}
            onChange={(e) => setNewFaculty(prev => ({ ...prev, expertise: e.target.value }))}
            margin="normal"
          />
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
      </Dialog>
    </div>
  );
};

export default FacultyManagement;

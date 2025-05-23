import React, { useState, useEffect, useCallback } from 'react';
import { CircularProgress } from '@mui/material';

import { 
  getFacultyStatus 
} from '../../utils/facultyUtils';
import { useSchedule } from '../../context/ScheduleContext';
import { getAllFaculty, getFacultyAssignments, deleteFaculty } from '../../utils/supabaseClient';
import { safeSaveFaculty } from '../../utils/contextHelpers';
import FacultyCard from './FacultyCard';
import FacultyDetails from './FacultyDetails';

const FacultyManagement = () => {
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
  
  const loadFacultyData = useCallback(async () => {
    setLoading(true);
    try {
      const facultyData = await getAllFaculty();
      
      const facultyWithAssignments = await Promise.all(
        facultyData.map(async (fac) => {
          const assignments = await getFacultyAssignments(fac.id);
          const facultyWithStatus = {
            ...fac,
            assignments
          };
          
          return {
            ...facultyWithStatus,
            ...getFacultyStatus(facultyWithStatus, assignments)
          };
        })
      );
      
      setFaculty(facultyWithAssignments);
    } catch (error) {
      console.error('Error loading faculty data:', error);
      showNotification('Failed to load faculty data from the database', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);
  
  useEffect(() => {
    loadFacultyData();
  }, [loadFacultyData]);

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

  const handleAddFaculty = async () => {
    try {
      const expertiseArray = newFaculty.expertise.split(',').map(e => e.trim()).filter(e => e);
      
      const newFacultyMember = {
        id: null,
        name: newFaculty.name,
        department: newFaculty.department,
        email: newFaculty.email,
        expertise: expertiseArray,
        status: 'Available'
      };
      
      // Use the safer faculty creation function
      showNotification('Adding new faculty member...', 'info');
      
      const result = await safeSaveFaculty(newFacultyMember);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create faculty');
      }
      
      await loadFacultyData();
      
      setShowAddDialog(false);
      setNewFaculty({ name: '', department: '', email: '', expertise: '' });
      showNotification('Faculty member added successfully', 'success');
    } catch (error) {
      console.error('Error adding faculty:', error);
      showNotification(`Failed to add faculty: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  const handleUpdateFaculty = async (updatedFaculty) => {
    try {
      const facultyId = await saveFaculty(updatedFaculty);
      
      if (!facultyId) {
        throw new Error('Failed to update faculty - no ID returned');
      }
      
      await loadFacultyData();
      setSelectedFaculty(updatedFaculty);
      showNotification('Faculty member updated successfully', 'success');
    } catch (error) {
      console.error('Error updating faculty:', error);
      showNotification(`Failed to update faculty: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  const handleDeleteFaculty = async (facultyId) => {
    try {
      await deleteFaculty(facultyId);
      await loadFacultyData();
      setSelectedFaculty(null);
      showNotification('Faculty member deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting faculty:', error);
      showNotification('Failed to delete faculty member from the database', 'error');
    }
  };

  if (loading) {
    return (
      <div className="faculty-management">
        <div className="loading-container">
          <CircularProgress size={40} />
          <p>Loading faculty data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="faculty-management">
      <div className="faculty-content-container">
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
              <div className="faculty-cards-container">
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
    </div>
  );
};

export default FacultyManagement;

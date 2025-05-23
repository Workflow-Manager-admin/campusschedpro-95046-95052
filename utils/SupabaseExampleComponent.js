import React, { useState, useEffect } from 'react';
import { 
  getAllFaculty, 
  getFacultyAssignments,
  saveFaculty,
  deleteFaculty
} from './supabaseClient';
import { CircularProgress, Alert, Snackbar } from '@mui/material';

const SupabaseExampleComponent = () => {
  const [faculty, setFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Load faculty data
  useEffect(() => {
    async function loadFaculty() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllFaculty();
        setFaculty(data);
      } catch (err) {
        console.error('Error loading faculty:', err);
        setError('Failed to load faculty data');
      } finally {
        setLoading(false);
      }
    }
    
    loadFaculty();
  }, []);
  
  // Load faculty assignments when a faculty is selected
  useEffect(() => {
    async function loadAssignments() {
      if (!selectedFaculty) {
        setAssignments([]);
        return;
      }
      
      setLoading(true);
      try {
        const data = await getFacultyAssignments(selectedFaculty.id);
        setAssignments(data);
      } catch (err) {
        console.error('Error loading assignments:', err);
        setNotification({
          open: true,
          message: 'Failed to load faculty assignments',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadAssignments();
  }, [selectedFaculty]);
  
  // Handle faculty selection
  const handleSelectFaculty = (faculty) => {
    setSelectedFaculty(faculty);
  };
  
  // Handle faculty deletion
  const handleDeleteFaculty = async (id) => {
    try {
      setLoading(true);
      const success = await deleteFaculty(id);
      
      if (success) {
        setFaculty(prev => prev.filter(f => f.id !== id));
        if (selectedFaculty?.id === id) {
          setSelectedFaculty(null);
        }
        
        setNotification({
          open: true,
          message: 'Faculty deleted successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to delete faculty');
      }
    } catch (err) {
      console.error('Error deleting faculty:', err);
      setNotification({
        open: true,
        message: 'Error deleting faculty',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle notification close
  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // Render loading state
  if (loading && faculty.length === 0) {
    return (
      <div className="loading-container">
        <CircularProgress />
        <p>Loading faculty data...</p>
      </div>
    );
  }
  
  // Render error state
  if (error && faculty.length === 0) {
    return (
      <div className="error-container">
        <Alert severity="error">
          {error}
          <button onClick={() => window.location.reload()}>Retry</button>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="supabase-example">
      <h2>Faculty Directory (Supabase Example)</h2>
      
      <div className="faculty-container">
        {/* Faculty List */}
        <div className="faculty-list">
          {faculty.map(person => (
            <div 
              key={person.id} 
              className={`faculty-item ${selectedFaculty?.id === person.id ? 'selected' : ''}`}
              onClick={() => handleSelectFaculty(person)}
            >
              <h3>{person.name}</h3>
              <p>{person.department}</p>
              <span className={`status-badge status-${person.status?.toLowerCase()}`}>
                {person.status}
              </span>
            </div>
          ))}
        </div>
        
        {/* Faculty Details */}
        {selectedFaculty && (
          <div className="faculty-details">
            <div className="details-header">
              <h2>{selectedFaculty.name}</h2>
              <button 
                className="btn btn-danger"
                onClick={() => handleDeleteFaculty(selectedFaculty.id)}
                disabled={loading}
              >
                Delete Faculty
              </button>
            </div>
            
            <div className="details-content">
              <p><strong>Department:</strong> {selectedFaculty.department}</p>
              <p><strong>Email:</strong> {selectedFaculty.email}</p>
              <p><strong>Status:</strong> {selectedFaculty.status}</p>
              
              <div className="expertise-section">
                <h3>Expertise</h3>
                <div className="expertise-tags">
                  {selectedFaculty.expertise?.map((exp, i) => (
                    <span key={i} className="expertise-tag">{exp}</span>
                  ))}
                  {!selectedFaculty.expertise?.length && <p>No expertise listed</p>}
                </div>
              </div>
              
              <div className="assignments-section">
                <h3>Course Assignments</h3>
                {loading ? (
                  <div className="loading-indicator">
                    <CircularProgress size={20} />
                    <span>Loading assignments...</span>
                  </div>
                ) : (
                  <div className="assignments-list">
                    {assignments.map(course => (
                      <div key={course.id} className="course-assignment">
                        <div className="course-header">
                          <span className="course-code">{course.code}</span>
                          <span className="course-name">{course.name}</span>
                        </div>
                        <div className="schedule-times">
                          {course.schedule.map((slot, i) => (
                            <span key={i} className="time-slot">{slot}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {!assignments.length && <p>No course assignments</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
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
  );
};

export default SupabaseExampleComponent;

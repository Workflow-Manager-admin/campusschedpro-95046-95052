import React, { useState } from 'react';
import PropTypes from 'prop-types';


import { CircularProgress } from '@mui/material';

const FacultyDetails = ({ faculty, onSave, onDelete, onClose, isUpdatingFaculty, isDeleting }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFaculty, setEditedFaculty] = useState(faculty);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedFaculty(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    onSave(editedFaculty);
    setIsEditing(false);
    // Notify parent component that editing is complete
    onClose();
  };

  const getScheduleDisplay = () => {
    const schedule = {};
    faculty.assignments.forEach(course => {
      course.schedule.forEach(slot => {
        if (!schedule[slot]) schedule[slot] = [];
        schedule[slot].push(course);
      });
    });
    return schedule;
  };

  return (
    <div className="faculty-details">
      <div className="details-header">
        <h2>{faculty.name}</h2>
        <div className="faculty-actions">
          {isEditing ? (
            <>
              <button 
                className="btn btn-icon" 
                onClick={handleSave}
                title="Save Changes"
              >
                ✓
              </button>
              <button 
                className="btn btn-icon" 
                onClick={() => setIsEditing(false)}
                title="Cancel"
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn btn-icon" 
                onClick={() => setIsEditing(true)}
                title="Edit Faculty"
              >
                ✎
              </button>
              <button 
                className="btn btn-icon btn-danger" 
                onClick={onDelete}
                title="Delete Faculty"
                disabled={isDeleting}
              >
                {isDeleting ? <CircularProgress size={18} /> : '🗑'}
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="edit-form">
          {/* ...fields unchanged... */}
          <div className="dialog-actions">
            <button
              className="btn btn-icon"
              onClick={handleSave}
              title="Save Changes"
              disabled={isUpdatingFaculty}
            >
              {isUpdatingFaculty ? <CircularProgress size={18} /> : '✓'}
            </button>
            <button
              className="btn btn-icon"
              onClick={() => setIsEditing(false)}
              title="Cancel"
              disabled={isUpdatingFaculty}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="faculty-info-section">
            <p><strong>Department:</strong> {faculty.department}</p>
            <p><strong>Email:</strong> {faculty.email}</p>
            <p><strong>Expertise:</strong> {faculty.expertise.join(', ')}</p>
          </div>

          <div className="faculty-stats">
            <div className="stat-item">
              <div className="stat-value">{faculty.load.totalCourses}</div>
              <div className="stat-label">Courses</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{faculty.load.totalCredits}</div>
              <div className="stat-label">Credits</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{faculty.load.hoursPerWeek}</div>
              <div className="stat-label">Hours/Week</div>
            </div>
          </div>

          <div className="course-assignment">
            <h3>Current Assignments</h3>
            <div className="assignment-list">
              {faculty.assignments.map(course => (
                <div key={course.id} className="assignment-item">
                  <div className="assignment-info">
                    <div className="assignment-code">{course.code}</div>
                    <div className="assignment-name">{course.name}</div>
                    <div className="assignment-schedule">
                      {course.schedule.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="schedule-section">
            <h3>Weekly Schedule</h3>
            <div className="schedule-grid">
              {Object.entries(getScheduleDisplay()).map(([slot, courses]) => (
                <div key={slot} className="schedule-item">
                  <span>{slot}</span>
                  <span>{courses.map(c => c.code).join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

FacultyDetails.propTypes = {
  faculty: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    department: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    expertise: PropTypes.arrayOf(PropTypes.string).isRequired,
    status: PropTypes.string.isRequired,
    load: PropTypes.shape({
      totalCourses: PropTypes.number.isRequired,
      totalCredits: PropTypes.number.isRequired,
      hoursPerWeek: PropTypes.number.isRequired
    }).isRequired,
    assignments: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      schedule: PropTypes.arrayOf(PropTypes.string).isRequired
    })).isRequired
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isUpdatingFaculty: PropTypes.bool,
  isDeleting: PropTypes.bool
};

export default FacultyDetails;

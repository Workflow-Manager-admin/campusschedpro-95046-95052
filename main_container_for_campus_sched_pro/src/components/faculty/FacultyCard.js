import React from 'react';
import PropTypes from 'prop-types';
import { Paper } from '@mui/material';
const FacultyCard = ({ faculty, selected, onClick }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'Available':
        return 'status-available';
      case 'Partially Booked':
        return 'status-partial';
      case 'Fully Booked':
        return 'status-booked';
      default:
        return '';
    }
  };

  return (
    <div
      className={`faculty-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ 
        boxShadow: selected ? '0 2px 8px rgba(0, 0, 0, 0.15)' : '0 1px 4px rgba(0, 0, 0, 0.1)',
        background: '#ffffff'
      }}
    >
      <div className="faculty-card-header">
        <div className="faculty-info">
          <h3>{faculty.name}</h3>
          <div className="faculty-department">{faculty.department}</div>
        </div>
        <span className={`faculty-status ${getStatusClass(faculty.status)}`}>
          {faculty.status}
        </span>
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
    </div>
  );
};

FacultyCard.propTypes = {
  faculty: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    department: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    load: PropTypes.shape({
      totalCourses: PropTypes.number.isRequired,
      totalCredits: PropTypes.number.isRequired,
      hoursPerWeek: PropTypes.number.isRequired
    }).isRequired
  }).isRequired,
  selected: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

export default FacultyCard;

import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Debug component for schedule information - only used in development
 */
const ScheduleDebug = ({ schedule, filteredSchedule, courses, yearFilter }) => {
  const [showDebug, setShowDebug] = useState(false);
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="schedule-debug" style={{ marginTop: '20px' }}>
      <button 
        onClick={() => setShowDebug(!showDebug)}
        style={{ 
          background: 'none', 
          border: '1px solid #ccc', 
          padding: '4px 8px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
      </button>
      
      {showDebug && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          background: '#f8f8f8', 
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '12px',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          <h4>Schedule Debug</h4>
          <p>Filter: {yearFilter}</p>
          <p>Courses: {courses.length}</p>
          <p>Time Slots: {Object.keys(schedule).length}</p>
          <p>Filtered Time Slots: {filteredSchedule ? Object.keys(filteredSchedule).length : 'N/A'}</p>
          
          <hr />
          
          <details>
            <summary>Course IDs</summary>
            <pre>{JSON.stringify(courses.map(c => c.id), null, 2)}</pre>
          </details>
          
          <details>
            <summary>Schedule Structure</summary>
            <pre>{JSON.stringify(Object.keys(schedule).map(key => ({
              slot: key,
              courses: schedule[key].length
            })), null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

ScheduleDebug.propTypes = {
  schedule: PropTypes.object.isRequired,
  filteredSchedule: PropTypes.object,
  courses: PropTypes.array.isRequired,
  yearFilter: PropTypes.string.isRequired
};

export default ScheduleDebug;

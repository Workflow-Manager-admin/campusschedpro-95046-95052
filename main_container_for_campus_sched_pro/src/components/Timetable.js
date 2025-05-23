import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import TimeSlot from './TimeSlot';
import ShareScheduleButton from './ShareScheduleButton';
import { useSchedule } from '../context/ScheduleContext';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
];

// Use the schedule from props but fall back to context if not provided
const Timetable = ({ schedule: propSchedule, onCourseMove }) => {
  const { schedule: contextSchedule, removeCourseFromSlot, showNotification } = useSchedule();
  const timetableRef = useRef(null);
  
  // Use provided schedule or fall back to context
  const schedule = propSchedule || contextSchedule;

  // Timetable ref for capturing the element
  const timetableRef = useRef(null);

  return (
    <div className="timetable-container">
      <div className="timetable-actions">
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleDownloadImage}
          className="download-button"
        >
          Share/Download Schedule as Image
        </Button>
      </div>
      <div className="timetable" ref={timetableRef}>
      <div className="timetable-header">
        <div className="time-column">Time</div>
        {DAYS.map(day => (
          <div key={day} className="day-column">{day}</div>
        ))}
      </div>
      <div className="timetable-body">
        {TIME_SLOTS.map(time => (
          <div key={time} className="time-row">
            <div className="time-label">{time}</div>
            {DAYS.map(day => {
              const slotId = `${day}-${time}`;
              return (
                <TimeSlot
                  key={slotId}
                  day={day}
                  time={time}
                  courses={schedule[slotId] || []}
                  removeCourseFromSlot={removeCourseFromSlot}
                />
              );
            })}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

Timetable.propTypes = {
  schedule: PropTypes.object,
  onCourseMove: PropTypes.func
};

export default Timetable;

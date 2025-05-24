import React from 'react';
import PropTypes from 'prop-types';
import TimeSlot from './TimeSlot';
import { useSchedule } from '../context/ScheduleContext';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
];

// Use the schedule from props but fall back to context if not provided
const Timetable = ({ schedule: propSchedule, onCourseMove, timetableRef }) => {
  const { schedule: contextSchedule, removeCourseFromSlot } = useSchedule();
  
  // Ensure we have a valid schedule object
  const schedule = propSchedule || contextSchedule || {};

  // Simple debug to track number of courses in schedule
  const courseCount = Object.values(schedule).reduce((sum, courses) => 
    sum + (Array.isArray(courses) ? courses.length : 0), 0);

  return (
    <div className="timetable-container">
      <div className="timetable timetable-for-export" ref={timetableRef}>
        <div className="timetable-header">
          <div className="time-column">Time</div>
          {DAYS.map(day => (
            <div key={day} className="day-column">{day}</div>
          ))}
        </div>
        {courseCount === 0 && (
          <div className="no-courses-message">
            No scheduled courses found. Try adding courses to the schedule.
          </div>
        )}
        <div className="timetable-body">
          {TIME_SLOTS.map(time => (
            <div key={time} className="time-row">
              <div className="time-label">{time}</div>
              {DAYS.map(day => {
                const slotId = `${day}-${time}`;
                const coursesInSlot = Array.isArray(schedule[slotId]) ? schedule[slotId] : [];
                
                return (
                  <TimeSlot
                    key={slotId}
                    day={day}
                    time={time}
                    courses={coursesInSlot}
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
  onCourseMove: PropTypes.func,
  timetableRef: PropTypes.oneOfType([
    PropTypes.func, 
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ])
};

export default Timetable;

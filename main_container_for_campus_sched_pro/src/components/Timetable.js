import React from 'react';
import PropTypes from 'prop-types';
import TimeSlot from './TimeSlot';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
];

const Timetable = ({ courses, schedule, onCourseMove }) => {
  return (
    <div className="timetable">
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
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

Timetable.propTypes = {
  courses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      credits: PropTypes.number.isRequired,
      instructor: PropTypes.string.isRequired,
      room: PropTypes.string
    })
  ).isRequired,
  schedule: PropTypes.object.isRequired,
  onCourseMove: PropTypes.func.isRequired
};

export default Timetable;

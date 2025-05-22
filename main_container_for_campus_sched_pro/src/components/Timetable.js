import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from '@hello-pangea/dnd';
import TimeSlot from './TimeSlot';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
];

const Timetable = ({ courses, onCourseMove }) => {
  const [schedule, setSchedule] = useState({});

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // Update the schedule state
    const newSchedule = { ...schedule };
    const sourceSlot = source.droppableId;
    const destSlot = destination.droppableId;
    
    // Remove from source
    if (newSchedule[sourceSlot]) {
      newSchedule[sourceSlot] = newSchedule[sourceSlot].filter(
        course => course.id !== draggableId
      );
    }
    
    // Add to destination
    if (!newSchedule[destSlot]) {
      newSchedule[destSlot] = [];
    }
    
    const movedCourse = courses.find(course => course.id === draggableId);
    if (movedCourse) {
      newSchedule[destSlot] = [...newSchedule[destSlot], movedCourse];
    }
    
    setSchedule(newSchedule);
    if (onCourseMove) {
      onCourseMove(newSchedule);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
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
              {DAYS.map(day => (
                <TimeSlot
                  key={`${day}-${time}`}
                  day={day}
                  time={time}
                  courses={schedule[`${day}-${time}`] || []}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </DragDropContext>
  );
};

Timetable.propTypes = {
  courses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      credits: PropTypes.number.isRequired,
      instructor: PropTypes.string.isRequired
    })
  ).isRequired,
  onCourseMove: PropTypes.func
};

export default Timetable;

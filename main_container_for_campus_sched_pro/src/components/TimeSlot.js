import React from 'react';
import { Droppable } from '@hello-pangea/dnd';

const TimeSlot = ({ day, time, courses }) => {
  const slotId = `${day}-${time}`;
  
  return (
    <Droppable droppableId={slotId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`time-slot ${snapshot.isDraggingOver ? 'dragging-over' : ''} ${courses.length > 0 ? 'occupied' : ''}`}
        >
          {courses.map((course, index) => (
            <div key={course.id} className="course-item">
              {course.name}
              <div className="course-details">
                <span>{course.instructor}</span>
                <span>{course.room}</span>
              </div>
            </div>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default TimeSlot;

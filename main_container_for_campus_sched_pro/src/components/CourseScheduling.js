import React, { useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import Timetable from './Timetable';
import Course from './Course';

const SAMPLE_COURSES = [
  {
    id: 'course-1',
    name: 'Introduction to Computer Science',
    code: 'CS101',
    credits: 3,
    instructor: 'Dr. Smith'
  },
  {
    id: 'course-2',
    name: 'Data Structures',
    code: 'CS201',
    credits: 4,
    instructor: 'Dr. Johnson'
  },
  {
    id: 'course-3',
    name: 'Database Systems',
    code: 'CS301',
    credits: 3,
    instructor: 'Dr. Davis'
  }
];

const CourseScheduling = () => {
  const [courses, setCourses] = useState(SAMPLE_COURSES);
  const [schedule, setSchedule] = useState({});

  const handleScheduleChange = (newSchedule) => {
    setSchedule(newSchedule);
  };

  return (
    <div className="course-scheduling">
      <div className="scheduling-header">
        <h2>Course Scheduling</h2>
        <button className="btn btn-accent">Save Schedule</button>
      </div>
      
      <div className="scheduling-container">
        <div className="courses-panel">
          <div className="panel-header">
            <h3>Available Courses</h3>
            <button className="btn">Add Course</button>
          </div>
          <Droppable droppableId="courses-list">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="courses-list"
              >
                {courses.map((course, index) => (
                  <Course key={course.id} course={course} index={index} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
        
        <div className="timetable-panel">
          <Timetable
            courses={courses}
            onCourseMove={handleScheduleChange}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseScheduling;

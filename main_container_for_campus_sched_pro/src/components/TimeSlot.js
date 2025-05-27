import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Paper, IconButton, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReduxDroppable from './ReduxDroppable';
import { useSchedule } from '../context/ScheduleContext';

const TimeSlot = ({ day, time, courses, removeCourseFromSlot }) => {
  const slotId = `${day}-${time}`;
  const {
    actionLoadingState,
    unscheduleCourseFromSlot: contextUnscheduleCourseFromSlot
  } = useSchedule() || {};

  // Ensure courses is always an array for safety
  const safeCourses = Array.isArray(courses) ? courses : [];

  const getSlotColor = () => {
    if (!safeCourses.length) return 'var(--background-light)';
    if (safeCourses.length > 1) return 'rgba(255, 87, 34, 0.1)'; // Conflict color
    return 'rgba(46, 125, 50, 0.1)'; // Occupied color
  };

  const handleRemoveCourse = (course, index, event) => {
    event.stopPropagation();
    const removeFn = removeCourseFromSlot || contextUnscheduleCourseFromSlot;
    if (!removeFn) {
      console.warn("No removeCourseFromSlot or context unscheduleCourseFromSlot provided to TimeSlot component");
      return;
    }
    try {
      const [rmDay, rmTime] = slotId.split('-');
      if (course && course.id) {
        removeFn(course.id, rmDay, rmTime).catch(error => {
          console.error("Error removing course:", error);
        });
      } else {
        console.error("Cannot remove course: Invalid course object or missing ID");
      }
    } catch (error) {
      console.error("Error removing course:", error);
    }
  };

  // DEBUG: Render meta and slot courses for slot tracking
  const debugSlotMeta = typeof window !== "undefined" && window._scheduleDebug;
  if (debugSlotMeta && window._scheduleDebug) {
    window._scheduleDebug[`slot_render_${slotId}`] = {
      slotId,
      courses: safeCourses,
      courseIds: safeCourses.map(c=>c.id),
      courseCodes: safeCourses.map(c=>c.code)
    };
  }

  return (
    <ReduxDroppable 
      droppableId={slotId}
      className="time-slot"
      style={{ backgroundColor: getSlotColor(), position: 'relative' }}
    >
      {(provided, snapshot) => (
        <div data-debugslot={slotId} style={{ position: 'relative' }}>
          {/* DEBUG: Add small slot info at corner for visual slot tracking */}
          <div style={{ position: "absolute", top: 1, right: 4, fontSize: "9px", opacity: 0.25, pointerEvents: "none" }}>
            {slotId}
            <br />
            <span style={{ fontWeight: 700 }}>
              {safeCourses.length} course{safeCourses.length!==1 ? "s" : ""}
            </span>
          </div>
          {safeCourses.map((course, index) => {
            const isCourseLoading = actionLoadingState && actionLoadingState.courseId === course.id;
            return (
              <Tooltip
                key={`${course.id}-${index}`}
                title={`${course.code} - ${course.instructor} (${course.room || 'No room assigned'})`}
                placement="top"
                arrow
              >
                <Paper 
                  className="course-item"
                  elevation={1}
                  style={{ position: 'relative' }}
                >
                  {isCourseLoading && (
                    <div className="course-card-spinner" style={{ top: 8, right: 8 }}>
                      <CircularProgress size={20}/>
                    </div>
                  )}
                  <div className="course-item-header">
                    <span className="course-code">{course.code}</span>
                    <span className="course-credits">{course.credits} cr</span>
                    <IconButton 
                      className="remove-course-btn"
                      size="small"
                      onClick={(e) => handleRemoveCourse(course, index, e)}
                      aria-label="Remove course"
                      title="Remove this course instance from schedule"
                      disabled={isCourseLoading}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </div>
                  <div className="course-name">{course.name}</div>
                  <div className="course-details">
                    <span><strong>Instructor:</strong> {course.instructor}</span>
                    <span><strong>Room:</strong> {course.room || 'TBA'}</span>
                  </div>
                </Paper>
              </Tooltip>
            );
          })}
        </div>
      )}
    </ReduxDroppable>
  );
};

TimeSlot.propTypes = {
  day: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
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
  removeCourseFromSlot: PropTypes.func
};

export default TimeSlot;

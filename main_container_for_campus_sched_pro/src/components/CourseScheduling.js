import React, { useCallback } from "react";
import { useSchedule } from "../context/ScheduleContext";
import DataFetchErrorBoundary from "./common/DataFetchErrorBoundary";
import { CircularProgress } from "@mui/material";
import "../styles/CourseScheduling.css";

const CourseScheduling = () => {
  const { courses, courseSchedule, isLoading, errors, refreshData } = useSchedule();

  const handleRetry = useCallback(() => {
    if (refreshData) {
      return refreshData();
    }
  }, [refreshData]);

  if (isLoading) {
    return (
      <div className="loader-container">
        <CircularProgress />
        <p>Loading course scheduling data...</p>
      </div>
    );
  }

  return (
    <DataFetchErrorBoundary 
      onRetry={handleRetry}
      errorMessage="Failed to load course schedule data. Please try again."
    >
      <div className="container">
        <h2>Course List</h2>
        {errors?.courses ? (
          <div className="error-alert">
            Error loading courses: {errors.courses}
          </div>
        ) : (
          <table className="entity-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Credits</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(courses) ? courses : []).map(course => (
                <tr key={course.id}>
                  <td>{course.code}</td>
                  <td>{course.name}</td>
                  <td>{course.credits}</td>
                </tr>
              ))}
              {(!courses || courses.length === 0) && (
                <tr>
                  <td colSpan="3" className="no-data">
                    No courses available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <h2>Course Schedule</h2>
        {errors?.schedule ? (
          <div className="error-alert">
            Error loading schedule: {errors.schedule}
          </div>
        ) : (
          <table className="entity-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Day</th>
                <th>Time</th>
                <th>Faculty</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(courseSchedule) ? courseSchedule : []).map((sched, idx) => (
                <tr key={idx}>
                  <td>{sched.course_code || sched.course_id}</td>
                  <td>{sched.day}</td>
                  <td>{sched.time}</td>
                  <td>{sched.faculty_name || sched.faculty_id}</td>
                </tr>
              ))}
              {(!courseSchedule || courseSchedule.length === 0) && (
                <tr>
                  <td colSpan="4" className="no-data">
                    No schedule entries available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </DataFetchErrorBoundary>
  );
};

export default CourseScheduling;

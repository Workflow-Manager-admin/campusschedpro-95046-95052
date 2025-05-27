import React from "react";
import { useSchedule } from "../context/ScheduleContext";
import "../styles/CourseScheduling.css";

const CourseScheduling = () => {
  const { courses, courseSchedule, loading, errors, refreshData } = useSchedule();

  if (loading) {
    return <div className="loader">Loading course scheduling data...</div>;
  }

  if (errors?.general) {
    return (
      <div className="error-container">
        <strong>Error: {errors.general}</strong>
        <button onClick={refreshData} className="btn btn-accent">Retry</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Course List</h2>
      <table className="entity-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Credits</th>
            {/* Only show flat schema columns */}
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
        </tbody>
      </table>

      <h2>Course Schedule</h2>
      <table className="entity-table">
        <thead>
          <tr>
            <th>Course</th>
            <th>Day</th>
            <th>Time</th>
            <th>Faculty</th>
            {/* Only show flat view columns (customize if needed as per your view fields) */}
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
        </tbody>
      </table>
      </div>
    </DataFetchErrorBoundary>
  );
};

export default CourseScheduling;

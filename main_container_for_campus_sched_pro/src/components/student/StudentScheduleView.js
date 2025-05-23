import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Checkbox, 
  FormControlLabel, 
  FormGroup, 
  Button, 
  Alert
} from '@mui/material';
import { useSchedule } from '../../context/ScheduleContext';
import Timetable from '../Timetable';
import { getStudentSchedule, formatPrintableSchedule } from '../../utils/scheduleUtils';
import { setSelectedCourses, setYearFilter, togglePrintView } from '../../redux/actions/studentActions';

// Sample student data - in a real app this would come from authentication/user state
const SAMPLE_STUDENT = {
  id: 'student-1',
  name: 'Alex Johnson',
  courses: ['course-1', 'course-2', 'course-5'] // IDs of enrolled courses
};

const StudentScheduleView = () => {
  const { courses, schedule } = useSchedule();
  const dispatch = useDispatch();
  const studentState = useSelector(state => state.student);
  
  const [student] = useState(SAMPLE_STUDENT);
  const selectedCourses = studentState.selectedCourses.length > 0 ? 
    studentState.selectedCourses : student.courses;
  const showPrintView = studentState.printViewActive;
  const yearFilter = studentState.yearFilter;
  
  // Initialize Redux state with student courses
  useEffect(() => {
    if (studentState.selectedCourses.length === 0) {
      dispatch(setSelectedCourses(student.courses));
    }
  }, [dispatch, student.courses, studentState.selectedCourses.length]);
  
  // Get only the courses this student is enrolled in
  const enrolledCourses = courses.filter(course => 
    student.courses.includes(course.id)
  );

  // Apply year filter to enrolled courses if needed
  const filteredEnrolledCourses = yearFilter === 'All Years'
    ? enrolledCourses
    : enrolledCourses.filter(course => course.academicYear && course.academicYear === yearFilter);

  // Create a filtered schedule based on enrolled courses
  const studentSchedule = getStudentSchedule(
    schedule, 
    filteredEnrolledCourses.map(course => course.id)
  );
  
  // Handle course selection changes
  // Update filtered courses when course selection changes
  const handleCourseToggle = useCallback((courseId) => {
    setSelectedCourses(prev => {
      const newSelection = prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId];
      
      return newSelection;
    });
  }, []);

  // Generate printable schedule
  const printableSchedule = formatPrintableSchedule(studentSchedule);

  // Handle print functionality
  const handlePrint = useCallback(() => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 100);
  }, []);

  return (
    <div className={`student-schedule ${showPrintView ? 'print-view' : ''}`}>
      <div className="student-header no-print">
        <div>
          <h2>My Class Schedule</h2>
          <div className="student-info">Student: {student.name}</div>
        </div>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handlePrint}
          className="print-button"
        >
          Print Schedule
        </Button>
      </div>

      <div className="course-filter-panel no-print">
        <div className="filter-header">
          <h3>My Courses</h3>
          <div className="year-filter-container">
            <label htmlFor="year-filter-select">Filter by Year:</label>
            <select
              id="year-filter-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="year-filter-select"
            >
              <option value="All Years">All Years</option>
              <option value="First Year">First Year</option>
              <option value="Second Year">Second Year</option>
              <option value="Third Year">Third Year</option>
              <option value="Fourth Year">Fourth Year</option>
            </select>
          </div>
        </div>
        <FormGroup>
          {filteredEnrolledCourses.map(course => (
            <FormControlLabel
              key={course.id}
              control={
                <Checkbox
                  checked={selectedCourses.includes(course.id)}
                  onChange={() => handleCourseToggle(course.id)}
                  color="primary"
                />
              }
              label={`${course.code} - ${course.name}`}
            />
          ))}
        </FormGroup>
      </div>

      {Object.keys(studentSchedule).length === 0 ? (
        <div className="no-schedule">
          <Alert severity="info">
            {filteredEnrolledCourses.length === 0 
              ? "No courses match the selected year filter" 
              : "No courses have been scheduled yet. Please check back later or select different courses."}
          </Alert>
        </div>
      ) : (
        <>
          <div className="timetable-view no-print">
            <Timetable schedule={studentSchedule} />
          </div>

          <div className="print-schedule print-only">
            <h1>Class Schedule - {student.name}</h1>
            
            {Object.entries(printableSchedule).map(([day, daySchedule]) => {
              if (daySchedule.length === 0) return null;
              
              return (
                <div key={day} className="print-day">
                  <h2>{day}</h2>
                  <table className="print-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Course</th>
                        <th>Instructor</th>
                        <th>Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daySchedule.map((slot, idx) => (
                        <tr key={idx}>
                          <td>{slot.time}</td>
                          <td>{slot.course}</td>
                          <td>{slot.instructor}</td>
                          <td>{slot.room}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentScheduleView;

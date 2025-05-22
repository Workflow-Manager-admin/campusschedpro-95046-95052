import React, { useState, useCallback } from 'react';
import { 
  Checkbox, 
  FormControlLabel, 
  FormGroup, 
  Button, 
  Alert, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem 
} from '@mui/material';
import { useSchedule } from '../../context/ScheduleContext';
import Timetable from '../Timetable';
import { getStudentSchedule, formatPrintableSchedule } from '../../utils/scheduleUtils';

const ACADEMIC_YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

// Sample student data - in a real app this would come from authentication/user state
const SAMPLE_STUDENT = {
  id: 'student-1',
  name: 'Alex Johnson',
  courses: ['course-1', 'course-2', 'course-5'] // IDs of enrolled courses
};

const StudentScheduleView = () => {
  const { courses, schedule } = useSchedule();
  const [student] = useState(SAMPLE_STUDENT);
  const [selectedCourses, setSelectedCourses] = useState(student.courses);
  const [showPrintView, setShowPrintView] = useState(false);
  const [yearFilter, setYearFilter] = useState('All Years');
  
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
  const handleCourseToggle = useCallback((courseId) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
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
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150, mb: 2 }}>
            <InputLabel id="year-filter-label">Filter by Year</InputLabel>
            <Select
              labelId="year-filter-label"
              id="year-filter"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              label="Filter by Year"
            >
              <MenuItem value="All Years">All Years</MenuItem>
              {ACADEMIC_YEARS.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
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

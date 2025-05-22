import React, { useCallback, useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { 
  Alert, 
  Snackbar, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormControlLabel, 
  Checkbox, 
  FormGroup, 
  Typography 
} from '@mui/material';
import Timetable from './Timetable';
import Course from './Course';
import { validateCourseMove, findScheduleConflicts } from '../utils/scheduleUtils';
import { useSchedule } from '../context/ScheduleContext';

const ACADEMIC_YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

const CourseScheduling = () => {
  const { 
    courses,
    setCourses,
    schedule, 
    setSchedule,
    notification,
    showNotification,
    handleCloseNotification
  } = useSchedule();
  
  // State for add course dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    code: '',
    credits: 3,
    instructor: '',
    expectedEnrollment: 30,
    requiresLab: false,
    requiredEquipment: [],
    academicYear: 'First Year',
    department: 'IT',
  });
  
  // State for year filter
  const [yearFilter, setYearFilter] = useState('All Years');

  const handleDragEnd = useCallback((result) => {
    const { source, destination, draggableId } = result;

    // Drop outside valid area
    if (!destination) return;

    const course = courses.find(c => c.id === draggableId);
    if (!course) return;

    try {
      // Moving from course list to timetable
      if (source.droppableId === 'courses-list') {
        const validation = validateCourseMove(schedule, destination.droppableId, course);
        if (!validation.valid) {
          showNotification(validation.message, 'error');
          return;
        }

        const newSchedule = { ...schedule };
        if (!newSchedule[destination.droppableId]) {
          newSchedule[destination.droppableId] = [];
        }
        newSchedule[destination.droppableId].push(course);

        const conflicts = findScheduleConflicts(newSchedule);
        if (conflicts.length > 0) {
          showNotification(`Warning: Found ${conflicts.length} scheduling conflicts`, 'warning');
        }

        setSchedule(newSchedule);
      }
      // Moving between timetable slots
      else {
        const validation = validateCourseMove(schedule, destination.droppableId, course);
        if (!validation.valid) {
          showNotification(validation.message, 'error');
          return;
        }

        const newSchedule = { ...schedule };
        
        // Remove from source
        newSchedule[source.droppableId] = newSchedule[source.droppableId]
          .filter(c => c.id !== draggableId);
        
        // Add to destination
        if (!newSchedule[destination.droppableId]) {
          newSchedule[destination.droppableId] = [];
        }
        newSchedule[destination.droppableId].push(course);

        const conflicts = findScheduleConflicts(newSchedule);
        if (conflicts.length > 0) {
          showNotification(`Warning: Found ${conflicts.length} scheduling conflicts`, 'warning');
        }

        setSchedule(newSchedule);
      }
    } catch (error) {
      // Use a more friendly error handling approach
      showNotification(`Error during drag operation: ${error.message}`, 'error');
    }
  }, [schedule, courses, setSchedule, showNotification]);

  const handleSaveSchedule = useCallback(() => {
    const conflicts = findScheduleConflicts(schedule);
    if (conflicts.length > 0) {
      showNotification('Cannot save schedule with conflicts. Please resolve them first.', 'error');
      return;
    }
    
    // Check for courses without room assignments
    const unassignedCourses = Object.values(schedule).flat().filter(course => !course.room);
    if (unassignedCourses.length > 0) {
      showNotification(`Warning: ${unassignedCourses.length} courses don't have room assignments`, 'warning');
    }
    
    // Here we would typically save to backend
    showNotification('Schedule saved successfully!', 'success');
  }, [schedule, showNotification]);
  
  // Function to handle opening add course dialog
  const handleOpenAddDialog = () => {
    setShowAddDialog(true);
  };
  
  // Function to handle closing add course dialog
  const handleCloseAddDialog = () => {
    setShowAddDialog(false);
    setNewCourse({
      name: '',
      code: '',
      credits: 3,
      instructor: '',
      expectedEnrollment: 30,
      requiresLab: false,
      requiredEquipment: [],
      academicYear: 'First Year',
      department: 'IT',
    });
  };
  
  // Function to handle input change in the add course form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCourse(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Function to handle checkbox change
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setNewCourse(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Function to handle adding a new course
  const handleAddCourse = () => {
    // Validate form
    if (!newCourse.name || !newCourse.code || !newCourse.instructor) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    // Create new course with unique ID
    const newCourseWithId = {
      ...newCourse,
      id: `course-${Date.now()}`,
      requiredEquipment: newCourse.requiresLab ? ['Computers'] : []
    };
    
    // Add to courses array
    setCourses(prev => [...prev, newCourseWithId]);
    showNotification(`Course ${newCourseWithId.code} added successfully`, 'success');
    handleCloseAddDialog();
  };

  // Filter courses by academic year - safely handle courses that might not have academicYear
  const filteredCourses = yearFilter === 'All Years' 
    ? courses 
    : courses.filter(course => course.academicYear && course.academicYear === yearFilter);

  return (
    <div className="course-scheduling">
      <div className="scheduling-header">
        <h2>Course Scheduling</h2>
        <div className="header-actions">
          <button 
            className="btn"
            onClick={() => window.location.href = '/conflicts'}
          >
            View Conflicts
          </button>
          <button 
            className="btn btn-accent"
            onClick={handleSaveSchedule}
            style={{ marginLeft: '10px' }}
          >
            Save Schedule
          </button>
        </div>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="scheduling-container">
          <div className="courses-panel">
            <div className="panel-header">
              <h3>Available Courses</h3>
              <button className="btn" onClick={handleOpenAddDialog}>Add Course</button>
            </div>
            
            <div className="course-filters">
              <FormControl variant="outlined" size="small" fullWidth sx={{ minWidth: 150 }}>
                <InputLabel id="year-filter-label">Academic Year</InputLabel>
                <Select
                  labelId="year-filter-label"
                  id="year-filter"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  label="Academic Year"
                >
                  <MenuItem value="All Years">All Years</MenuItem>
                  {ACADEMIC_YEARS.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            
            <Droppable droppableId="courses-list">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="courses-list"
                >
                  {filteredCourses.map((course, index) => (
                    <Course 
                      key={course.id} 
                      course={course} 
                      index={index}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
          
          <div className="timetable-panel">
            <Timetable
              schedule={schedule}
              onCourseMove={setSchedule}
            />
          </div>
        </div>
      </DragDropContext>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
      
      {/* Add Course Dialog */}
      <Dialog 
        open={showAddDialog} 
        onClose={handleCloseAddDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Course</DialogTitle>
        <DialogContent>
          <div className="form-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px' }}>
            <TextField
              label="Course Name"
              name="name"
              value={newCourse.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            
            <TextField
              label="Course Code"
              name="code"
              value={newCourse.code}
              onChange={handleInputChange}
              fullWidth
              required
            />
            
            <TextField
              label="Instructor"
              name="instructor"
              value={newCourse.instructor}
              onChange={handleInputChange}
              fullWidth
              required
            />
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <TextField
                label="Credits"
                name="credits"
                value={newCourse.credits}
                onChange={handleInputChange}
                type="number"
                fullWidth
              />
              
              <TextField
                label="Expected Enrollment"
                name="expectedEnrollment"
                value={newCourse.expectedEnrollment}
                onChange={handleInputChange}
                type="number"
                fullWidth
              />
            </div>
            
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                name="department"
                value={newCourse.department}
                onChange={handleInputChange}
                label="Department"
              >
                <MenuItem value="IT">IT</MenuItem>
                <MenuItem value="Computer Science">Computer Science</MenuItem>
                <MenuItem value="Engineering">Engineering</MenuItem>
                <MenuItem value="Mathematics">Mathematics</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Academic Year</InputLabel>
              <Select
                name="academicYear"
                value={newCourse.academicYear}
                onChange={handleInputChange}
                label="Academic Year"
              >
                {ACADEMIC_YEARS.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormGroup>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={newCourse.requiresLab}
                    onChange={handleCheckboxChange}
                    name="requiresLab"
                  />
                } 
                label="Requires Lab"
              />
            </FormGroup>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button 
            onClick={handleAddCourse}
            variant="contained"
            color="primary"
          >
            Add Course
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CourseScheduling;

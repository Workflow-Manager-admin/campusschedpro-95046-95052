import React, { useCallback, useState, useRef, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import ReduxDragDropContext from './ReduxDragDropContext';
import CourseBulkImport from './CourseBulkImport';
import ReduxDroppable from './ReduxDroppable';
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
import CourseDetails from './CourseDetails';
import ShareScheduleButton from './ShareScheduleButton';
import { validateCourseMove, findScheduleConflicts } from '../utils/scheduleUtils';
import { useSchedule } from '../context/ScheduleContext';

const ACADEMIC_YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

const CourseScheduling = () => {
  const { 
    courses,
    schedule, 
    setSchedule,
    notification,
    showNotification,
    handleCloseNotification,
    addCourse,
    updateCourse,
    deleteCourseById,
    isLoading
  } = useSchedule();
  
  const timetableRef = useRef(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
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
  const [yearFilter, setYearFilter] = useState('All Years');
  
  // State to store the filtered schedule when academic year filter is applied
  const [filteredSchedule, setFilteredSchedule] = useState(null);

  const handleDragEnd = useCallback((result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const course = courses.find(c => c.id === draggableId);
    if (!course) return;

    try {
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
      } else {
        const validation = validateCourseMove(schedule, destination.droppableId, course);
        if (!validation.valid) {
          showNotification(validation.message, 'error');
          return;
        }

        const newSchedule = { ...schedule };
        newSchedule[source.droppableId] = newSchedule[source.droppableId]
          .filter(c => c.id !== draggableId);
        
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
      showNotification(`Error during drag operation: ${error.message}`, 'error');
    }
  }, [schedule, courses, setSchedule, showNotification]);

  const handleSaveSchedule = useCallback(() => {
    const conflicts = findScheduleConflicts(schedule);
    if (conflicts.length > 0) {
      showNotification('Cannot save schedule with conflicts. Please resolve them first.', 'error');
      return;
    }
    
    const unassignedCourses = Object.values(schedule).flat().filter(course => !course.room);
    if (unassignedCourses.length > 0) {
      showNotification(`Warning: ${unassignedCourses.length} courses don't have room assignments`, 'warning');
    }
    
    showNotification('Schedule saved successfully!', 'success');
  }, [schedule, showNotification]);
  
  const handleOpenAddDialog = () => {
    setShowAddDialog(true);
  };
  
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
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCourse(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setNewCourse(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleAddCourse = async () => {
    if (!newCourse.name || !newCourse.code || !newCourse.instructor) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    const courseToAdd = {
      ...newCourse,
      requiredEquipment: newCourse.requiresLab ? ['Computers'] : []
    };
    
    try {
      const courseId = await addCourse(courseToAdd);
      
      if (!courseId) {
        throw new Error('Failed to create course - no ID returned');
      }
      
      handleCloseAddDialog();
      showNotification('Course added successfully', 'success');
    } catch (error) {
      console.error('Error adding course:', error);
      showNotification(`Failed to add course: ${error.message || 'Unknown error'}`, 'error');
    }
  };
  
  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setShowEditDialog(true);
  };
  
  const handleUpdateCourse = async (updatedCourse) => {
    try {
      await updateCourse(updatedCourse);
      setShowEditDialog(false);
      setSelectedCourse(null);
      showNotification(`Course ${updatedCourse.code} updated successfully`, 'success');
    } catch (error) {
      console.error('Error updating course:', error);
      showNotification(`Failed to update course: ${error.message || 'Unknown error'}`, 'error');
    }
  };
  
  const handleDeleteCourse = async (course) => {
    try {
      const success = await deleteCourseById(course.id);
      if (success) {
        setShowEditDialog(false);
        setSelectedCourse(null);
        showNotification(`Course ${course.code} deleted successfully`, 'success');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      showNotification(`Failed to delete course: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  // Filter courses based on selected academic year
  const filteredCourses = yearFilter === 'All Years' 
    ? courses 
    : courses.filter(course => course.academicYear && course.academicYear === yearFilter);
    
  // Filter schedule based on academic year
  useEffect(() => {
    if (yearFilter === 'All Years') {
      setFilteredSchedule(null); // Use the full schedule
    } else {
      // Create a filtered copy of the schedule that only includes courses from the selected year
      const filtered = {};
      
      // Iterate through all time slots in the schedule
      Object.entries(schedule).forEach(([slotId, coursesInSlot]) => {
        if (!coursesInSlot || !Array.isArray(coursesInSlot)) return;
        
        // Filter courses in this slot by academic year
        const filteredCoursesInSlot = coursesInSlot.filter(
          course => course && course.academicYear === yearFilter
        );
        
        // Only include the slot if it has courses after filtering
        if (filteredCoursesInSlot.length > 0) {
          filtered[slotId] = filteredCoursesInSlot;
        }
      });
      
      setFilteredSchedule(filtered);
    }
  }, [yearFilter, schedule]);

  if (isLoading) {
    return (
      <div className="course-scheduling">
        <div className="loading-container">
          <CircularProgress size={40} />
          <p>Loading course data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-scheduling">
      <div className="course-scheduling-content">
        <div className="scheduling-header">
          <div className="header-title-section">
            <h2>Course Scheduling</h2>
            <div className="share-button-container">
              <ShareScheduleButton 
                targetRef={timetableRef} 
                onNotification={showNotification}
                academicYear={yearFilter}
              />
            </div>
          </div>
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
        
        <div className="scheduling-content">
          <ReduxDragDropContext onDragEnd={handleDragEnd}>
            <div className="scheduling-container">
              <div className="courses-panel">
                <div className="panel-header">
                  <h3>Available Courses</h3>
                  <div className="course-header-actions">
                    <button className="btn" onClick={handleOpenAddDialog}>Add Course</button>
                    <CourseBulkImport onComplete={() => {
                      showNotification('Course import completed. Refreshing data...', 'success');
                    }} />
                  </div>
                </div>
                
                <div className="course-filters">
                  <div className="filter-header">
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      Filter courses by academic year:
                    </Typography>
                  </div>
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
                  {yearFilter !== 'All Years' && (
                    <Typography variant="body2" sx={{ mt: 1, fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
                      <span style={{ color: 'var(--primary-green)', marginRight: '4px' }}>✓</span> 
                      Showing {filteredCourses.length} courses for {yearFilter}
                    </Typography>
                  )}
                </div>
                
                <ReduxDroppable droppableId="courses-list" className="courses-list">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {filteredCourses.map((course, index) => (
                        <Course 
                          key={course.id} 
                          course={course} 
                          index={index}
                          onEdit={() => handleEditCourse(course)}
                          onDelete={() => handleDeleteCourse(course)}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </ReduxDroppable>
              </div>
              
              <div className="timetable-panel">
                <div className="timetable-header-controls">
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {yearFilter === 'All Years' 
                      ? 'Full Schedule' 
                      : `Schedule for ${yearFilter}`}
                  </Typography>
                </div>
                <Timetable
                  schedule={filteredSchedule || schedule}
                  onCourseMove={setSchedule}
                  timetableRef={timetableRef}
                />
              </div>
            </div>
          </ReduxDragDropContext>

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
          
          <Dialog 
            open={showAddDialog} 
            onClose={handleCloseAddDialog}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>Add New Course</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px' }}>
                <TextField
                  label="Course Name"
                  name="name"
                  value={newCourse.name}
                  onChange={handleInputChange}
                  fullWidth
                  margin="dense"
                />
                
                <TextField
                  label="Course Code"
                  name="code"
                  value={newCourse.code}
                  onChange={handleInputChange}
                  fullWidth
                  margin="dense"
                />
                
                <TextField
                  label="Instructor"
                  name="instructor"
                  value={newCourse.instructor}
                  onChange={handleInputChange}
                  fullWidth
                  margin="dense"
                />
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <TextField
                    label="Credits"
                    name="credits"
                    value={newCourse.credits}
                    onChange={handleInputChange}
                    type="number"
                    fullWidth
                    margin="dense"
                  />
                  
                  <TextField
                    label="Expected Enrollment"
                    name="expectedEnrollment"
                    value={newCourse.expectedEnrollment}
                    onChange={handleInputChange}
                    type="number"
                    fullWidth
                    margin="dense"
                  />
                </div>
                
                <FormControl fullWidth margin="dense">
                  <InputLabel id="department-label">Department</InputLabel>
                  <Select
                    labelId="department-label"
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
                
                <FormControl fullWidth margin="dense">
                  <InputLabel id="academic-year-label">Academic Year</InputLabel>
                  <Select
                    labelId="academic-year-label"
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
                disabled={!newCourse.name || !newCourse.code || !newCourse.instructor}
              >
                Add Course
              </Button>
            </DialogActions>
          </Dialog>
          
          {selectedCourse && (
            <CourseDetails
              course={selectedCourse}
              open={showEditDialog}
              onSave={handleUpdateCourse}
              onDelete={() => handleDeleteCourse(selectedCourse)}
              onClose={() => {
                setShowEditDialog(false);
                setSelectedCourse(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseScheduling;

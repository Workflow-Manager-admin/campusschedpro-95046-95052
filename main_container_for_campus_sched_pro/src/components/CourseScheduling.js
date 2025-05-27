import React, { useCallback, useState, useRef, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import ReduxDragDropContext from './ReduxDragDropContext';
import CourseBulkImport from '../components/common/CourseBulkImport';
import ReduxDroppable from './ReduxDroppable';
import ScheduleDebug from './ScheduleDebug';
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
    isLoading,
    refreshData,
    removeCourseFromSlot,
    faculty,
    actionLoadingState,
    scheduleCourseToSlot,
    unscheduleCourseFromSlot
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
  const [showBugFixTest, setShowBugFixTest] = useState(false);
  
  // State to store the filtered schedule when academic year filter is applied
  const [filteredSchedule, setFilteredSchedule] = useState(null);

  const handleDragEnd = useCallback((result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const course = courses.find(c => c.id === draggableId);
    if (!course) return;

    // Enforce: facultyId and roomId must NOT be null
    // (Assume instructor, room, facultyId, roomId available on the course object)
    // Attempt to infer from course and warn/block if missing
    const facultyId = course.facultyId || null;
    const roomId = course.roomId || null;
    const needsFaculty = !facultyId; // Consider as invalid if still null/undefined
    const needsRoom = !roomId;

    if (needsFaculty || needsRoom) {
      showNotification(
        `Cannot schedule course: Please assign a valid ${needsFaculty ? "faculty" : ""}${needsFaculty && needsRoom ? " and " : ""}${needsRoom ? "room" : ""} before scheduling.`,
        'error'
      );
      if (refreshData) refreshData();
      return;
    }

    try {
      // Common validation for both source types
      const validation = validateCourseMove(schedule, destination.droppableId, course);
      if (!validation.valid) {
        showNotification(validation.message, 'error');
        return;
      }

      // Remove all optimistic UI state mutation for schedule change!
      // Only update UI through provider/context after DB commit + reload
      let sourceDay, sourceTime, destDay, destTime;

      if (source.droppableId !== 'courses-list') {
        [sourceDay, sourceTime] = source.droppableId.split('-');
      }

      [destDay, destTime] = destination.droppableId.split('-');

      // If moving from courses list to a time slot
      if (source.droppableId === 'courses-list') {
        // Only persist using context method, UI will update after confirmation
        scheduleCourseToSlot(course.id, facultyId, roomId, destDay, destTime)
          .then(success => {
            if (!success) {
              showNotification('Error scheduling course. Please try again.', 'error');
              if (refreshData) refreshData();
            }
          });
      }
      // If moving between slots (rescheduling)
      else {
        // First unschedule, then schedule via context methods; do NOT touch schedule state until reload
        unscheduleCourseFromSlot(course.id, sourceDay, sourceTime)
          .then(unscheduleSuccess => {
            if (!unscheduleSuccess) {
              showNotification('Error unscheduling course from previous slot.', 'error');
              if (refreshData) refreshData();
              return false;
            }
            return scheduleCourseToSlot(course.id, facultyId, roomId, destDay, destTime);
          })
          .then(scheduleSuccess => {
            if (scheduleSuccess === false) {
              showNotification('Error rescheduling course. Please try again.', 'error');
              if (refreshData) refreshData();
            }
          });
      }

      // Do not modify schedule or check for conflicts directly here, new provider state will do that
    } catch (error) {
      showNotification(`Error during drag operation: ${error.message}`, 'error');
      if (refreshData) refreshData();
    }
  }, [schedule, courses, setSchedule, showNotification, refreshData, scheduleCourseToSlot, unscheduleCourseFromSlot]);

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
  
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState(null);

  const handleAddCourse = async () => {
    if (!newCourse.name || !newCourse.code || !newCourse.instructor) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    const courseToAdd = {
      ...newCourse,
      requiredEquipment: newCourse.requiresLab ? ['Computers'] : []
    };

    setIsAddingCourse(true);
    try {
      const courseId = await addCourse(courseToAdd);

      if (!courseId) {
        throw new Error('Failed to create course - no ID returned');
      }

      // Only close dialog and show notification after full state has reloaded
      if (typeof refreshData === "function") await refreshData();

      handleCloseAddDialog();
      // Ensure user only sees success if DB and UI are fully in sync
      showNotification('Course added successfully', 'success');
    } catch (error) {
      showNotification(`Failed to add course: ${error.message || 'Unknown error'}`, 'error');
      // Also trigger a refresh for safety
      if (typeof refreshData === "function") await refreshData();
    } finally {
      setIsAddingCourse(false);
    }
  };
  
  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setShowEditDialog(true);
  };
  
  const handleUpdateCourse = async (updatedCourse) => {
    setIsUpdatingCourse(true);
    try {
      await updateCourse(updatedCourse);
      setShowEditDialog(false);
      setSelectedCourse(null);
      showNotification(`Course ${updatedCourse.code} updated successfully`, 'success');
    } catch (error) {
      showNotification(`Failed to update course: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsUpdatingCourse(false);
    }
  };
  
  const handleDeleteCourse = async (course) => {
    setDeletingCourseId(course.id);
    try {
      const success = await deleteCourseById(course.id);
      if (success) {
        if (typeof refreshData === "function") await refreshData();
        setShowEditDialog(false);
        setSelectedCourse(null);
        // Only notify once UI (and DB) are confirmed in sync
        showNotification(`Course ${course.code} deleted successfully`, 'success');
      }
    } catch (error) {
      showNotification(`Failed to delete course: ${error.message || 'Unknown error'}`, 'error');
      // Also trigger state refresh if error (to keep UI in sync) 
      if (typeof refreshData === "function") await refreshData();
    } finally {
      setDeletingCourseId(null);
    }
  };

  // Filter courses based on selected academic year
  const filteredCourses = yearFilter === 'All Years' 
    ? courses 
    : courses.filter(course => {
        // Ensure we're filtering correctly, accounting for possible data inconsistencies
        if (!course) return false;
        
        // Handle potential null or undefined academicYear
        const courseYear = course.academicYear || 'Unknown';
        return courseYear === yearFilter;
      });
      
  // For debugging when there are issues with course display
  useEffect(() => {
    // Removed console logs for ESLint compliance
    
    if (courses.length > 0 && filteredCourses.length === 0 && yearFilter !== 'All Years') {
      // This would help diagnose issues with academic year data
      // Removed console.warn for ESLint compliance
    }
  }, [filteredCourses, courses, yearFilter]);
    
  // Filter schedule based on academic year
  useEffect(() => {
    if (yearFilter === 'All Years') {
      setFilteredSchedule(null); // Use the full schedule
    } else {
      // Create a filtered copy of the schedule that only includes courses from the selected year
      const filtered = {};
      
      // Iterate through all time slots in the schedule
      Object.entries(schedule).forEach(([slotId, coursesInSlot]) => {
        // Ensure coursesInSlot is an array before processing
        if (!Array.isArray(coursesInSlot)) return;
        
        // Filter courses in this slot by academic year
        const filteredCoursesInSlot = coursesInSlot.filter(course => {
          // Skip invalid courses
          if (!course || !course.id) return false;
          
          // Check if course has academicYear directly
          if (course.academicYear) {
            return course.academicYear === yearFilter;
          }
          
          // If not, look it up from the courses array
          const courseInfo = courses.find(c => c.id === course.id);
          return courseInfo && courseInfo.academicYear === yearFilter;
        });
        
        // Only include the slot if it has courses after filtering
        if (filteredCoursesInSlot.length > 0) {
          filtered[slotId] = filteredCoursesInSlot;
        }
      });
      
      setFilteredSchedule(filtered);
      
      // Removed console.log for ESLint compliance
    }
  }, [yearFilter, schedule, courses]);

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
            <Button 
              size="small" 
              variant="outlined"
              onClick={() => setShowBugFixTest(!showBugFixTest)}
              sx={{ mr: 1 }}
            >
              {showBugFixTest ? 'Hide Bug Fix Test' : 'Verify Bug Fix'}
            </Button>
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
            <button 
              className="btn"
              onClick={() => {
                showNotification('Refreshing data from database...', 'info');
                if (refreshData) {
                  try {
                    const result = refreshData();
                    
                    if (result && typeof result.then === 'function') {
                      // Handle as Promise if it is one
                      result.then(() => {
                        showNotification('Data refreshed successfully!', 'success');
                      }).catch(err => {
                        showNotification(`Error refreshing data: ${err.message}`, 'error');
                      });
                    } else {
                      // Handle non-Promise result
                      showNotification('Data refresh initiated', 'success');
                    }
                  } catch (error) {
                    showNotification(`Error refreshing data: ${error.message || 'Unknown error'}`, 'error');
                  }
                } else {
                  showNotification('Refresh data function is not available', 'error');
                }
              }}
              style={{ marginLeft: '10px' }}
              title="Reload all data from the database"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
        
        {showBugFixTest && (
          <React.Suspense fallback={<div>Loading test component...</div>}>
            {React.createElement(React.lazy(() => import('../tests/TestCoursesInSlotFix')))}
            {/* Try to load TestFunctionFixes, but include inline fallback */}
            <React.Suspense fallback={
              <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
                <h3>Inline Function Test</h3>
                <div>
                  {typeof refreshData === 'function' ? (
                    <div style={{ color: 'green' }}>✓ refreshData is properly available</div>
                  ) : (
                    <div style={{ color: 'red' }}>✗ refreshData is NOT available</div>
                  )}
                  
                  {typeof setSchedule === 'function' ? (
                    <div style={{ color: 'green' }}>✓ setSchedule is properly available</div>
                  ) : (
                    <div style={{ color: 'red' }}>✗ setSchedule is NOT available</div>
                  )}
                </div>
              </div>
            }>
              {React.createElement(React.lazy(() => import('../tests/TestFunctionFixes')))}
            </React.Suspense>
          </React.Suspense>
        )}
        
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
                      {filteredCourses.map((course, index) => {
                        // Determine unassigned
                        const missingFaculty = !course.facultyId;
                        const missingRoom = !course.roomId;
                        // Only allow drag if all data present
                        const dragDisabled = missingFaculty || missingRoom;

                        return (
                          <div key={course.code} className={`course-list-item${dragDisabled ? ' incomplete-assignment' : ''}`}>
                            <Course 
                              course={course} 
                              index={index}
                              onEdit={() => handleEditCourse(course)}
                              onDelete={() => handleDeleteCourse(course)}
                              dragDisabled={dragDisabled}
                            />
                            {(missingFaculty || missingRoom) && (
                              <div style={{ color: "crimson", fontSize: "0.82em", marginTop: 2 }}>
                                {missingFaculty && <span>Faculty not assigned.&nbsp;</span>}
                                {missingRoom && <span>Room not assigned.</span>}
                                <span style={{fontStyle: 'italic', color:'#de9311'}}> (cannot schedule)</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
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

                {/* Debug panel: show raw schedule for analysis of missing slots/issues */}
                <div style={{
                  margin: "2em 0",
                  padding: "1em",
                  border: "2px solid #faa",
                  background: "#fff2ea",
                  color: "#8a0000"
                }}>
                  <h4>Schedule Object State Dump (debug)</h4>
                  <div>
                    <b>Slot Count:</b> {Object.keys(schedule || {}).length} <br/>
                    <b>Keys:</b> {Object.keys(schedule || {}).join(', ') || '(none)'}
                  </div>
                  <details style={{ marginTop: "0.5em" }}>
                    <summary>Full Schedule Object</summary>
                    <pre style={{ fontSize: "0.75em", overflowX: "auto" }}>
                      {JSON.stringify(schedule, null, 2)}
                    </pre>
                  </details>
                  <details>
                    <summary>Debug: Window ⬩_scheduleDebug</summary>
                    <pre style={{ fontSize: "0.7em", overflowX: "auto" }}>
                      {typeof window !== "undefined" && window._scheduleDebug
                        ? JSON.stringify(window._scheduleDebug, null, 2)
                        : "(No window._scheduleDebug present)"}
                    </pre>
                  </details>
                </div>

                {/* Add debug panel in development - can be commented out for production */}
                <ScheduleDebug 
                  schedule={schedule}
                  filteredSchedule={filteredSchedule}
                  courses={courses}
                  yearFilter={yearFilter}
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
                
                <FormControl fullWidth margin="dense">
                  <InputLabel id="instructor-label">Instructor</InputLabel>
                  <Select
                    labelId="instructor-label"
                    name="instructor"
                    value={newCourse.instructor}
                    onChange={handleInputChange}
                    label="Instructor"
                  >
                    {faculty && faculty.length > 0 ? (
                      faculty.map(fac => (
                        <MenuItem key={fac.id} value={fac.name}>
                          {fac.name}
                        </MenuItem>
                      ))
                    ) : (
                      <>
                        <MenuItem value="John Smith">John Smith</MenuItem>
                        <MenuItem value="Jane Doe">Jane Doe</MenuItem>
                        <MenuItem value="Robert Johnson">Robert Johnson</MenuItem>
                      </>
                    )}
                  </Select>
                </FormControl>
                
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
              isUpdatingCourse={isUpdatingCourse}
              isDeleting={deletingCourseId === selectedCourse.id}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseScheduling;

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
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
  Grid
} from '@mui/material';

const ACADEMIC_YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

// PUBLIC_INTERFACE
/**
 * CourseDetails component for viewing and editing course information
 * @param {Object} props - Component props
 * @param {Object} props.course - Course object to display or edit
 * @param {Function} props.onSave - Callback when course is saved
 * @param {Function} props.onDelete - Callback when course is deleted
 * @param {Function} props.onClose - Callback to close the details view
 * @param {boolean} props.open - Whether the dialog is open
 */
const CourseDetails = ({ course, onSave, onDelete, onClose, open }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editedCourse, setEditedCourse] = useState({ ...course });

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setEditedCourse({ ...course });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedCourse(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberInputChange = (e) => {
    const { name, value } = e.target;
    setEditedCourse(prev => ({
      ...prev,
      [name]: parseInt(value, 10) || 0
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setEditedCourse(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSave = () => {
    // Ensure required equipment is updated based on requiresLab
    const updatedCourse = {
      ...editedCourse,
      requiredEquipment: editedCourse.requiresLab 
        ? [...new Set([...editedCourse.requiredEquipment || [], 'Computers'])]
        : editedCourse.requiredEquipment || []
    };
    
    onSave(updatedCourse);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(false);
  };

  if (!course) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      {!isEditing ? (
        <>
          <DialogTitle>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{course.name} ({course.code})</span>
              <div>
                <Button onClick={handleEditToggle} color="primary">
                  Edit
                </Button>
                <Button onClick={handleDelete} color="error">
                  {confirmDelete ? 'Confirm' : 'Delete'}
                </Button>
                {confirmDelete && (
                  <Button onClick={handleCancelDelete} color="primary">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} style={{ marginTop: '8px' }}>
              <Grid item xs={12}>
                <strong>Department:</strong> {course.department}
              </Grid>
              <Grid item xs={6}>
                <strong>Credits:</strong> {course.credits}
              </Grid>
              <Grid item xs={6}>
                <strong>Academic Year:</strong> {course.academicYear}
              </Grid>
              <Grid item xs={12}>
                <strong>Instructor:</strong> {course.instructor}
              </Grid>
              <Grid item xs={6}>
                <strong>Expected Enrollment:</strong> {course.expectedEnrollment}
              </Grid>
              <Grid item xs={6}>
                <strong>Requires Lab:</strong> {course.requiresLab ? 'Yes' : 'No'}
              </Grid>
              {course.requiredEquipment && course.requiredEquipment.length > 0 && (
                <Grid item xs={12}>
                  <strong>Required Equipment:</strong> {course.requiredEquipment.join(', ')}
                </Grid>
              )}
            </Grid>
          </DialogContent>
        </>
      ) : (
        <>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px' }}>
              <TextField
                label="Course Name"
                name="name"
                value={editedCourse.name}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                required
              />
              
              <TextField
                label="Course Code"
                name="code"
                value={editedCourse.code}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                required
              />
              
              <TextField
                label="Instructor"
                name="instructor"
                value={editedCourse.instructor}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                required
              />
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <TextField
                  label="Credits"
                  name="credits"
                  value={editedCourse.credits}
                  onChange={handleNumberInputChange}
                  type="number"
                  fullWidth
                  margin="dense"
                />
                
                <TextField
                  label="Expected Enrollment"
                  name="expectedEnrollment"
                  value={editedCourse.expectedEnrollment}
                  onChange={handleNumberInputChange}
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
                  value={editedCourse.department}
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
                  value={editedCourse.academicYear}
                  onChange={handleInputChange}
                  label="Academic Year"
                >
                  {ACADEMIC_YEARS.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={editedCourse.requiresLab}
                    onChange={handleCheckboxChange}
                    name="requiresLab"
                  />
                } 
                label="Requires Lab"
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button 
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={!editedCourse.name || !editedCourse.code || !editedCourse.instructor}
            >
              Save Changes
            </Button>
          </DialogActions>
        </>
      )}
      {!isEditing && (
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

CourseDetails.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    credits: PropTypes.number.isRequired,
    instructor: PropTypes.string.isRequired,
    department: PropTypes.string,
    academicYear: PropTypes.string,
    expectedEnrollment: PropTypes.number,
    requiresLab: PropTypes.bool,
    requiredEquipment: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
};

export default CourseDetails;

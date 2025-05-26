import { v4 as uuidv4 } from 'uuid';
import { enhancedSaveCourse, enhancedSaveRoom, enhancedSaveFaculty } from './entityHelpers';

// Safely import xlsx and uuid packages
/* eslint-disable no-undef */
let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
/* eslint-enable no-undef */
  console.error('XLSX library not available:', e);
  // Fallback implementation for build process
  XLSX = {
    utils: {
      aoa_to_sheet: () => ({}),
      book_new: () => ({}),
      book_append_sheet: () => {},
      sheet_to_json: () => ([])
    },
    writeFile: () => {},
    read: () => ({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } })
  };
}

/**
 * Creates an Excel workbook with given data and columns
 * 
 * @param {Array} data - Array of data rows
 * @param {Array} columns - Array of column definitions
 * @param {string} sheetName - Name of the worksheet
 * @returns {Object} - XLSX workbook
 */
const createWorkbook = (data, columns, sheetName) => {
  // Create header row with column names
  const headerRow = columns.map(col => col.header);
  
  // Create worksheet data including header
  const wsData = [headerRow, ...data];
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  return wb;
};

/**
 * Downloads an Excel file
 * 
 * @param {Object} workbook - XLSX workbook
 * @param {string} filename - Name of the file to download
 */
const downloadExcelFile = (workbook, filename) => {
  XLSX.writeFile(workbook, filename);
};

/**
 * Generates and downloads a course template Excel file
 */
export const generateCourseTemplate = () => {
  const columns = [
    { key: 'name', header: 'Course Name' },
    { key: 'code', header: 'Course Code' },
    { key: 'credits', header: 'Credits' },
    { key: 'instructor', header: 'Default Instructor' },
    { key: 'expectedEnrollment', header: 'Expected Enrollment' },
    { key: 'department', header: 'Department' },
    { key: 'requiresLab', header: 'Requires Lab (Yes/No)' },
    { key: 'requiredEquipment', header: 'Required Equipment (comma separated)' }
  ];
  
  // Example data row
  const exampleData = [
    [
      'Introduction to Computer Science',
      'CS101',
      '3',
      'Dr. Jane Smith',
      '30',
      'Computer Science',
      'Yes',
      'Projector, Whiteboard'
    ]
  ];
  
  const wb = createWorkbook(exampleData, columns, 'Courses');
  downloadExcelFile(wb, 'course_template.xlsx');
};

/**
 * Imports course data from an Excel file
 * 
 * @param {File} file - Excel file to import
 * @returns {Object} - Import results with success count and errors
 */
export const importCoursesFromExcel = async (file) => {
  try {
    const data = await readExcelFile(file);
    
    if (!data || data.length === 0) {
      throw new Error('No data found in the Excel file');
    }
    
    // Skip header row
    const rows = data.slice(1);
    
    const importedCourses = [];
    const errors = [];
    
    // Process each row
    rows.forEach((row, index) => {
      try {
        if (!row[0]) return; // Skip empty rows
        
        // Extract course data from row
        const course = {
          id: uuidv4(),
          name: row[0],
          code: row[1],
          credits: parseInt(row[2], 10) || 0,
          instructor: row[3] || '',
          expectedEnrollment: parseInt(row[4], 10) || 0,
          department: row[5] || '',
          requiresLab: row[6]?.toLowerCase() === 'yes',
          requiredEquipment: row[7] ? row[7].split(',').map(item => item.trim()) : []
        };
        
        // Validate required fields
        if (!course.name || !course.code) {
          throw new Error(`Row ${index + 2}: Course name and code are required`);
        }
        
        importedCourses.push(course);
      } catch (error) {
        errors.push({
          row: index + 2,
          message: error.message
        });
      }
    });
    
    // Save imported courses to the database using the enhanced entity helper
    const { enhancedSaveCourse } = require('./entityHelpers');
    
    let successCount = 0;
    const saveErrors = [];
    
    // Process each course
    for (const course of importedCourses) {
      try {
        const result = await enhancedSaveCourse(course);
        
        if (result.success) {
          successCount++;
        } else {
          saveErrors.push({
            message: `Could not save course ${course.code || 'unknown'}: ${result.message}`
          });
        }
      } catch (error) {
        saveErrors.push({
          message: `Error saving course ${course.code || 'unknown'}: ${error.message || 'Unknown error'}`
        });
      }
    }
    
    // Combine parsing errors with saving errors
    const allErrors = [...errors, ...saveErrors];
    
    return {
      success: successCount,
      errors: allErrors
    };
  } catch (error) {
    console.error('Error importing courses:', error);
    throw new Error(`Failed to import courses: ${error.message}`);
  }
};

/**
 * Generates and downloads a room template Excel file
 */
export const generateRoomTemplate = () => {
  const columns = [
    { key: 'name', header: 'Room Name' },
    { key: 'building', header: 'Building' },
    { key: 'capacity', header: 'Capacity' },
    { key: 'hasProjector', header: 'Has Projector (Yes/No)' },
    { key: 'hasComputers', header: 'Has Computers (Yes/No)' },
    { key: 'availableEquipment', header: 'Available Equipment (comma separated)' }
  ];
  
  // Example data row
  const exampleData = [
    [
      'Room 101',
      'Engineering Building',
      '30',
      'Yes',
      'Yes',
      'Projector, Whiteboard, Smart Board'
    ]
  ];
  
  const wb = createWorkbook(exampleData, columns, 'Rooms');
  downloadExcelFile(wb, 'room_template.xlsx');
};

/**
 * Imports room data from an Excel file
 * 
 * @param {File} file - Excel file to import
 * @returns {Object} - Import results with success count and errors
 */
export const importRoomsFromExcel = async (file) => {
  try {
    const data = await readExcelFile(file);
    
    if (!data || data.length === 0) {
      throw new Error('No data found in the Excel file');
    }
    
    // Skip header row
    const rows = data.slice(1);
    
    const importedRooms = [];
    const errors = [];
    
    // Process each row
    rows.forEach((row, index) => {
      try {
        if (!row[0]) return; // Skip empty rows
        
        // Extract room data from row
        const room = {
          id: uuidv4(),
          name: row[0],
          type: 'Classroom', // Default type
          building: row[1] || '',
          capacity: parseInt(row[2], 10) || 0,
          floor: '1', // Default floor
          equipment: row[5] ? row[5].split(',').map(item => item.trim()) : []
        };
        
        // Validate required fields
        if (!room.name) {
          throw new Error(`Row ${index + 2}: Room name is required`);
        }
        
        importedRooms.push(room);
      } catch (error) {
        errors.push({
          row: index + 2,
          message: error.message
        });
      }
    });
    
    // Save imported rooms to the database using the enhanced entity helper
    const { enhancedSaveRoom } = require('./entityHelpers');
    
    let successCount = 0;
    const saveErrors = [];
    
    // Process each room
    for (const room of importedRooms) {
      try {
        const result = await enhancedSaveRoom(room);
        
        if (result.success) {
          successCount++;
        } else {
          saveErrors.push({
            message: `Could not save room ${room.name || 'unknown'}: ${result.message}`
          });
        }
      } catch (error) {
        saveErrors.push({
          message: `Error saving room ${room.name || 'unknown'}: ${error.message || 'Unknown error'}`
        });
      }
    }
    
    // Combine parsing errors with saving errors
    const allErrors = [...errors, ...saveErrors];
    
    return {
      success: successCount,
      errors: allErrors
    };
  } catch (error) {
    console.error('Error importing rooms:', error);
    throw new Error(`Failed to import rooms: ${error.message}`);
  }
};

/**
 * Generates and downloads a faculty template Excel file
 */
export const generateFacultyTemplate = () => {
  const columns = [
    { key: 'name', header: 'Faculty Name' },
    { key: 'department', header: 'Department' },
    { key: 'email', header: 'Email' },
    { key: 'expertise', header: 'Expertise (comma separated)' }
  ];
  
  // Example data row
  const exampleData = [
    [
      'Dr. Jane Smith',
      'Computer Science',
      'jsmith@university.edu',
      'Machine Learning, Data Science, AI'
    ]
  ];
  
  const wb = createWorkbook(exampleData, columns, 'Faculty');
  downloadExcelFile(wb, 'faculty_template.xlsx');
};

/**
 * Imports faculty data from an Excel file
 * 
 * @param {File} file - Excel file to import
 * @returns {Object} - Import results with success count and errors
 */
export const importFacultyFromExcel = async (file) => {
  try {
    const data = await readExcelFile(file);
    
    if (!data || data.length === 0) {
      throw new Error('No data found in the Excel file');
    }
    
    // Skip header row
    const rows = data.slice(1);
    
    const importedFaculty = [];
    const errors = [];
    
    // Process each row
    rows.forEach((row, index) => {
      try {
        if (!row[0]) return; // Skip empty rows
        
        // Extract faculty data from row
        const faculty = {
          id: uuidv4(),
          name: row[0],
          department: row[1] || '',
          email: row[2] || '',
          expertise: row[3] ? row[3].split(',').map(item => item.trim()) : []
        };
        
        // Validate required fields
        if (!faculty.name || !faculty.email) {
          throw new Error(`Row ${index + 2}: Faculty name and email are required`);
        }
        
        importedFaculty.push(faculty);
      } catch (error) {
        errors.push({
          row: index + 2,
          message: error.message
        });
      }
    });
    
    // Save imported faculty to the database using the enhanced entity helper
    const { enhancedSaveFaculty } = require('./entityHelpers');
    
    let successCount = 0;
    const saveErrors = [];
    
    // Process each faculty member
    for (const faculty of importedFaculty) {
      try {
        const result = await enhancedSaveFaculty(faculty);
        
        if (result.success) {
          successCount++;
        } else {
          saveErrors.push({
            message: `Could not save faculty ${faculty.name || 'unknown'}: ${result.message}`
          });
        }
      } catch (error) {
        saveErrors.push({
          message: `Error saving faculty ${faculty.name || 'unknown'}: ${error.message || 'Unknown error'}`
        });
      }
    }
    
    // Combine parsing errors with saving errors
    const allErrors = [...errors, ...saveErrors];
    
    return {
      success: successCount,
      errors: allErrors
    };
  } catch (error) {
    console.error('Error importing faculty:', error);
    throw new Error(`Failed to import faculty: ${error.message}`);
  }
};

/**
 * Reads data from an Excel file
 * 
 * @param {File} file - Excel file to read
 * @returns {Array} - Excel data as array of arrays
 */
const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    /* eslint-disable no-undef */
    const reader = new FileReader();
    /* eslint-enable no-undef */
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of arrays
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

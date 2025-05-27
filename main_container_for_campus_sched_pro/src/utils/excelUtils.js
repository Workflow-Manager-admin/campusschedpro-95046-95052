import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver'; // NEW: FileSaver for robust cross-browser download

/**
 * PUBLIC_INTERFACE
 * Creates and downloads an Excel template file using FileSaver for robust downloads.
 * In case of download failure, it will call the errorCallback (if provided).
 * 
 * @param {Array} headers - Array of column headers
 * @param {Array} exampleData - Array of example data 
 * @param {string} filename - Name of the file to download
 * @param {function} errorCallback - Optional. Called with error message if download fails.
 */
const createAndDownloadTemplate = (headers, exampleData, filename, errorCallback) => {
  try {
    // Create worksheet with headers and example data
    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);

    // Create workbook and append worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    // Generate XLSX file as Blob (for FileSaver)
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    // Use FileSaver's saveAs (works in all supported browsers)
    saveAs(blob, filename);
  } catch (err) {
    if (errorCallback) {
      errorCallback("Template download failed. Please check your browser settings or try a different browser. (" + (err.message || err.toString()) + ")");
    } else {
      // Rethrow so error can surface in UI if no callback present
      throw err;
    }
  }
};

/**
 * PUBLIC_INTERFACE
 * Generates a course template Excel file for download
 */
export const generateCourseTemplate = (errorCallback) => {
  const headers = [
    'Course Name', 'Course Code', 'Credits', 'Instructor', 
    'Expected Enrollment', 'Department', 'Requires Lab (Yes/No)', 
    'Required Equipment (comma separated)'
  ];

  const exampleData = [[
    'Introduction to Programming', 'CS101', '3', 'Dr. Smith',
    '30', 'Computer Science', 'Yes', 'Computers, Projector'
  ]];

  createAndDownloadTemplate(headers, exampleData, 'course_template.xlsx', errorCallback);
};

/**
 * PUBLIC_INTERFACE
 * Generates a faculty template Excel file for download
 */
export const generateFacultyTemplate = (errorCallback) => {
  const headers = [
    'Faculty Name', 'Email', 'Department', 'Expertise (comma separated)'
  ];

  const exampleData = [[
    'Dr. Jane Smith', 'jsmith@example.edu', 'Computer Science', 
    'Machine Learning, Data Science, AI'
  ]];

  createAndDownloadTemplate(headers, exampleData, 'faculty_template.xlsx', errorCallback);
};

/**
 * PUBLIC_INTERFACE
 * Generates a room template Excel file for download
 */
export const generateRoomTemplate = (errorCallback) => {
  const headers = [
    'Room Name', 'Building', 'Type', 'Capacity', 'Floor',
    'Equipment (comma separated)'
  ];

  const exampleData = [[
    'Room 101', 'Engineering Building', 'Classroom', '30', '1',
    'Projector, Whiteboard, Computers'
  ]];

  createAndDownloadTemplate(headers, exampleData, 'room_template.xlsx', errorCallback);
};

/**
 * Reads data from an Excel file
 * 
 * @param {File} file - Excel file to read
 * @returns {Array} - Excel data as array of arrays
 */
const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
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

/**
 * Helper function to get or create a department
 */
const getOrCreateDepartmentId = async (name) => {
  if (!name) return null;
  
  // Check if department exists
  const { data: existing } = await supabase
    .from('departments')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  
  if (existing) return existing.id;
  
  // Create new department
  const { data } = await supabase
    .from('departments')
    .insert({ name })
    .select('id')
    .single();
  
  return data?.id || null;
};

/**
 * Imports course data from an Excel file
 * 
 * @param {File} file - Excel file to import
 * @returns {Object} - Import results with success count and errors
 */
export const importCoursesFromExcel = async (file) => {
  try {
    // Parse the Excel file
    const data = await readExcelFile(file);
    if (!data || data.length < 2) {
      return { success: 0, errors: [{ message: 'No valid data found in the file' }] };
    }
    
    const successfulImports = [];
    const errors = [];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[0]) continue;
      
      try {
        // Extract data from row
        const name = row[0];
        const code = row[1];
        const credits = parseInt(row[2], 10) || 0;
        const instructor = row[3];
        const expectedEnrollment = parseInt(row[4], 10) || 0;
        const department = row[5];
        const requiresLab = String(row[6] || '').toLowerCase() === 'yes';
        
        // Basic validation
        if (!name || !code) {
          throw new Error(`Row ${i + 1}: Course name and code are required`);
        }
        
        // Get department ID
        const departmentId = department ? await getOrCreateDepartmentId(department) : null;
        
        // Insert course into database
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .insert({
            id: uuidv4(),
            name,
            code,
            credits,
            expected_enrollment: expectedEnrollment,
            requires_lab: requiresLab,
            department_id: departmentId
          })
          .select();
        
        if (courseError) throw new Error(`Database error: ${courseError.message}`);
        
        successfulImports.push(courseData[0]);
      } catch (err) {
        errors.push({
          row: i + 1,
          message: err.message
        });
      }
    }
    
    return {
      success: successfulImports.length,
      errors: errors
    };
  } catch (error) {
    return {
      success: 0,
      errors: [{ message: `File processing error: ${error.message}` }]
    };
  }
};

/**
 * Helper function to get or create a building
 */
const getOrCreateBuildingId = async (name) => {
  if (!name) return null;
  
  // Check if building exists
  const { data: existing } = await supabase
    .from('buildings')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  
  if (existing) return existing.id;
  
  // Create new building
  const { data } = await supabase
    .from('buildings')
    .insert({ name })
    .select('id')
    .single();
  
  return data?.id || null;
};

/**
 * Imports room data from an Excel file
 * 
 * @param {File} file - Excel file to import
 * @returns {Object} - Import results with success count and errors
 */
export const importRoomsFromExcel = async (file) => {
  try {
    // Parse the Excel file
    const data = await readExcelFile(file);
    if (!data || data.length < 2) {
      return { success: 0, errors: [{ message: 'No valid data found in the file' }] };
    }
    
    const successfulImports = [];
    const errors = [];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[0]) continue;
      
      try {
        // Extract data from row
        const name = row[0];
        const building = row[1];
        const type = row[2] || 'Classroom';
        const capacity = parseInt(row[3], 10) || 0;
        const floor = row[4] || '1';
        
        // Basic validation
        if (!name) {
          throw new Error(`Row ${i + 1}: Room name is required`);
        }
        
        // Get building ID
        const buildingId = building ? await getOrCreateBuildingId(building) : null;
        
        // Insert room into database
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .insert({
            id: uuidv4(),
            name,
            building_id: buildingId,
            type,
            capacity,
            floor
          })
          .select();
        
        if (roomError) throw new Error(`Database error: ${roomError.message}`);
        
        successfulImports.push(roomData[0]);
      } catch (err) {
        errors.push({
          row: i + 1,
          message: err.message
        });
      }
    }
    
    return {
      success: successfulImports.length,
      errors: errors
    };
  } catch (error) {
    return {
      success: 0,
      errors: [{ message: `File processing error: ${error.message}` }]
    };
  }
};

/**
 * Imports faculty data from an Excel file
 * 
 * @param {File} file - Excel file to import
 * @returns {Object} - Import results with success count and errors
 */
export const importFacultyFromExcel = async (file) => {
  try {
    // Parse the Excel file
    const data = await readExcelFile(file);
    if (!data || data.length < 2) {
      return { success: 0, errors: [{ message: 'No valid data found in the file' }] };
    }
    
    const successfulImports = [];
    const errors = [];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[0]) continue;
      
      try {
        // Extract data from row
        const name = row[0];
        const email = row[1];
        const department = row[2];
        const expertise = row[3] ? String(row[3]).split(',').map(e => e.trim()) : [];
        
        // Basic validation
        if (!name || !email) {
          throw new Error(`Row ${i + 1}: Faculty name and email are required`);
        }
        
        // Get department ID
        const departmentId = department ? await getOrCreateDepartmentId(department) : null;
        
        // Insert faculty into database
        const { data: facultyData, error: facultyError } = await supabase
          .from('faculty')
          .insert({
            id: uuidv4(),
            name,
            email,
            department_id: departmentId,
            status: 'Available'
          })
          .select();
        
        if (facultyError) throw new Error(`Database error: ${facultyError.message}`);
        
        // Insert expertise if any
        if (expertise.length > 0 && facultyData && facultyData[0]) {
          const facultyId = facultyData[0].id;
          
          const expertiseRecords = expertise.map(item => ({
            faculty_id: facultyId,
            expertise: item
          }));
          
          await supabase
            .from('faculty_expertise')
            .insert(expertiseRecords);
        }
        
        successfulImports.push(facultyData[0]);
      } catch (err) {
        errors.push({
          row: i + 1,
          message: err.message
        });
      }
    }
    
    return {
      success: successfulImports.length,
      errors: errors
    };
  } catch (error) {
    return {
      success: 0,
      errors: [{ message: `File processing error: ${error.message}` }]
    };
  }
};
